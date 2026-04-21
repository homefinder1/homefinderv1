import json
import os
import sys
from urllib import request, error

from mkb_scraper import scrape_mkb
from boplatsvast_scraper import scrape_boplats
from boplatssyd_scraper import scrape_boplatssyd
from homeq_scraper import scrape_homeq


def normalisera_kalla(k):
    if not k:
        return "Okänd"
    if k == "Boplats":
        return "Boplats Väst"
    return k


def dedup_pa_url(annonser):
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


def skicka_till_edge_function(annonser, api_key):
    url = "https://njirepchwetcqhyxikha.supabase.co/functions/v1/upsert-annonser"
    body = json.dumps(annonser).encode("utf-8")
    req = request.Request(
        url, data=body, method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    resp = request.urlopen(req, timeout=300)
    return json.loads(resp.read().decode())


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

    api_key = os.environ.get("SCRAPER_API_KEY")
    if not api_key:
        print("VARNING: SCRAPER_API_KEY saknas — hoppar över uppladdning.", file=sys.stderr)
        return

    print(f"Skickar {len(unika)} annonser till databasen...")
    resultat = skicka_till_edge_function(unika, api_key)
    print(f"Klart! {resultat}")


if __name__ == "__main__":
    main()