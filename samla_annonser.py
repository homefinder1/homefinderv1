"""
Samlar annonser från alla scrapers och laddar upp dem till Supabase
(scraped_annonser-tabellen) med URL-deduplicering. Skriver också en
backup till annonser.json så den gamla flödet fortsätter att fungera.

Krävda miljövariabler:
  SUPABASE_URL                t.ex. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   service_role-nyckel (admin)

Kör lokalt:
  export SUPABASE_URL=...
  export SUPABASE_SERVICE_ROLE_KEY=...
  python samla_annonser.py
"""

import json
import os
import sys
from urllib import request, error

from mkb_scraper import scrape_mkb
from boplatsvast_scraper import scrape_boplats
from boplatssyd_scraper import scrape_boplatssyd
from homeq_scraper import scrape_homeq


# ----------------------------- Hjälpare -----------------------------

def normalisera_kalla(k):
    """Gamla data kan innehålla 'Boplats' som nu heter 'Boplats Väst'."""
    if not k:
        return "Okänd"
    if k == "Boplats":
        return "Boplats Väst"
    return k


def till_db_rad(annons):
    """Konvertera scraper-output till rad-format för scraped_annonser-tabellen."""
    return {
        "titel": annons.get("titel") or "",
        "omrade": annons.get("område") or None,
        "antal_rum": annons.get("antal_rum") or None,
        "storlek": annons.get("storlek") or None,
        "hyra": annons.get("hyra") or None,
        "ledig": annons.get("ledig") or None,
        "url": annons.get("url"),
        "kalla": normalisera_kalla(annons.get("källa")),
    }


def dedup_pa_url(annonser):
    """Behåll första annonsen per unik URL — annonser utan URL hoppas över."""
    sett = set()
    unika = []
    for a in annonser:
        url = a.get("url")
        if not url:
            continue
        if url in sett:
            continue
        sett.add(url)
        unika.append(a)
    return unika


def upsert_chunk(rader, supabase_url, service_key, chunk_storlek=500):
    """Skickar rader till Supabase i bitar. Vid URL-konflikt uppdateras raden."""
    endpoint = f"{supabase_url}/rest/v1/scraped_annonser?on_conflict=url"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # merge-duplicates = uppdatera befintliga rader (samma URL)
        # return=minimal = vi behöver inte få tillbaka raderna
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    sparade = 0
    for i in range(0, len(rader), chunk_storlek):
        bit = rader[i:i + chunk_storlek]
        body = json.dumps(bit).encode("utf-8")
        req = request.Request(endpoint, data=body, method="POST", headers=headers)
        try:
            request.urlopen(req, timeout=120)
            sparade += len(bit)
            print(f"  Sparade chunk {i // chunk_storlek + 1} ({sparade}/{len(rader)})")
        except error.HTTPError as e:
            felmeddelande = e.read().decode(errors="replace")[:500]
            print(
                f"FEL i chunk {i // chunk_storlek + 1}: HTTP {e.code} — {felmeddelande}",
                file=sys.stderr,
            )
            raise
    return sparade


# ----------------------------- Huvudflöde ---------------------------

def main():
    print("Kör MKB-scrapern...")
    mkb = scrape_mkb()
    print(f"  → {len(mkb)} annonser från MKB")

    print("Kör Boplats Väst-scrapern...")
    boplats = scrape_boplats()
    print(f"  → {len(boplats)} annonser från Boplats Väst")

    print("Kör Boplats Syd-scrapern...")
    boplatssyd = scrape_boplatssyd()
    print(f"  → {len(boplatssyd)} annonser från Boplats Syd")

    print("Kör HomeQ-scrapern...")
    homeq = scrape_homeq()
    print(f"  → {len(homeq)} annonser från HomeQ")

    print("Slår ihop och deduperar på URL...")
    alla = mkb + boplats + boplatssyd + homeq
    unika = dedup_pa_url(alla)
    print(f"  → {len(unika)} unika annonser (av {len(alla)} totalt)")


    # Ladda upp till databasen
    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        print(
            "VARNING: SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas — "
            "hoppar över databasuppladdning.",
            file=sys.stderr,
        )
        print(f"Klart! {len(unika)} annonser sparade till annonser.json.")
        return

    print(f"Laddar upp {len(unika)} annonser till scraped_annonser...")
    rader = [till_db_rad(a) for a in unika if a.get("url")]
    sparade = upsert_chunk(rader, supabase_url, service_key)
    print(f"Klart! {sparade} annonser upserterade i databasen.")


if __name__ == "__main__":
    main()
