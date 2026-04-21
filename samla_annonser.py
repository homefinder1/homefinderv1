import json
from mkb_scraper import scrape_mkb
from boplatsvast_scraper import scrape_boplats
from boplatssyd_scraper import scrape_boplatssyd
from homeq_scraper import scrape_homeq

print("Kör MKB-scrapern...")
mkb = scrape_mkb()

print("Kör Boplats Väst-scrapern...")
boplats = scrape_boplats()

print("Kör Boplats Syd-scrapern...")
boplatssyd = scrape_boplatssyd()

print("Kör HomeQ-scrapern...")
homeq = scrape_homeq()

print("Slår ihop alla annonser...")
alla = mkb + boplats + boplatssyd + homeq

with open("annonser.json", "w", encoding="utf-8") as f:
    json.dump(alla, f, ensure_ascii=False, indent=2)

print(f"Klart! Totalt {len(alla)} annonser sparade!")