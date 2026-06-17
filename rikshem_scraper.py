import requests
from bs4 import BeautifulSoup
import json
import re

def scrape_rikshem():
    annonser = []
    sedda_urls = set()
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    })

    print("Hämtar annonser från Rikshem...")
    
    sidnummer = 1
    while True:
        print(f"Hämtar sida {sidnummer}...")
        url = f"https://minasidor.rikshem.se/ledigt/lagenhet?page={sidnummer}"
        
        try:
            resp = session.get(url, timeout=30)
            soup = BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            print(f"Fel vid hämtning av sida {sidnummer}: {e}")
            break

        # Debug första sidan
        if sidnummer == 1:
            print(f"HTTP-status: {resp.status_code}")
            print(f"HTML (första 2000 tecken): {resp.text[:2000]}")

        # Hitta annonskort
        kort = soup.find_all(class_=re.compile("object"))
        har_annonser = False

        for kort_el in kort:
            text = kort_el.get_text(separator="\n").strip()
            if "Antal rum" not in text or "Hyra" not in text:
                continue

            har_annonser = True

            lank = kort_el.find("a", href=True)
            href = lank["href"] if lank else ""
            full_url = "https://minasidor.rikshem.se" + href if href.startswith("/") else href

            if not full_url or full_url in sedda_urls:
                continue
            sedda_urls.add(full_url)

            rader = [r.strip() for r in text.split("\n") if r.strip()]

            titel = rader[0] if rader else "Okänd"
            omrade = next((r for r in rader if any(s in r for s in ["Helsingborg", "Malmö", "Stockholm", "Uppsala", "Lund", "Umeå", "Luleå", "Östersund", "Västerås", "Norrköping", "Kalmar", "Halmstad", "Södertälje"])), "Okänd")
            rum = next((r for r in rader if "rum" in r.lower()), "Okänd")
            storlek = next((r for r in rader if "kvm" in r.lower() or "m²" in r), "Okänd")
            hyra = next((r for r in rader if "kr" in r.lower()), "Okänd")
            ledig = next((r for r in rader if re.search(r"\d{4}-\d{2}-\d{2}", r)), "Okänd")

            annonser.append({
                "titel": titel,
                "område": omrade,
                "antal_rum": rum,
                "storlek": storlek,
                "hyra": hyra,
                "ledig": ledig,
                "url": full_url,
                "källa": "Rikshem"
            })

        if not har_annonser:
            print(f"Inga fler annonser på sida {sidnummer}, avslutar!")
            break

        sidnummer += 1

    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_rikshem()
    with open("rikshem_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")
