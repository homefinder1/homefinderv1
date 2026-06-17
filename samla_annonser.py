import json
import os
import sys
from urllib import request, error
from datetime import datetime, date
from mkb_scraper import scrape_mkb
from boplatsvast_scraper import scrape_boplats
from boplatssyd_scraper import scrape_boplatssyd
from homeq_scraper import scrape_homeq
from bostad_stockholm_scraper import scrape_bostad_stockholm

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

def filtrera_utgangna(annonser):
    idag = date.today()
    aktiva = []
    for a in annonser:
        ledig = a.get("ledig", "")
        try:
            datum = datetime.strptime(ledig[:10], "%Y-%m-%d").date()
            if datum >= idag:
                aktiva.append(a)
        except:
            aktiva.append(a)
    return aktiva

def skicka_till_endpoint(annonser):
    url = "https://allakvadrat-canvas-magic.lovable.app/api/public/hooks/import-listings"
    body = json.dumps(annonser).encode("utf-8")
    req = request.Request(
        url, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; HomefinderBot/1.0)",
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

    print("Kör Bostadsförmedlingen Stockholm-scrapern...")
    bostad_sthlm = scrape_bostad_stockholm()
    print(f"  → {len(bostad_sthlm)} annonser från Bostadsförmedlingen Stockholm")

    print("Slår ihop och deduperar på URL...")
    alla = mkb + boplats + boplatssyd + homeq + bostad_sthlm
    unika = dedup_pa_url(alla)
    print(f"  → {len(unika)} unika annonser (av {len(alla)} totalt)")

    print("Filtrerar bort utgångna annonser...")
    unika = filtrera_utgangna(unika)
    print(f"  → {len(unika)} aktiva annonser efter filtrering")

    print(f"Skickar {len(unika)} annonser till databasen...")
    resultat = skicka_till_endpoint(unika)
    print(f"Klart! {resultat}")

if __name__ == "__main__":
    main()
