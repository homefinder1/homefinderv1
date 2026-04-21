from playwright.sync_api import sync_playwright
import json
import re

def scrape_mkb():
    annonser = []
    bas_url = "https://www.mkbfastighet.se/vill-hyra/lediga-lagenheter/?minarea=10&maxarea=200&minroom=1&maxroom=5&maxrentalpermonth=25000&shownewproduction=show&page="
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("Laddar sida 1...")
        page.goto(bas_url + "1")
        page.wait_for_timeout(3000)
        
        try:
            page.click("text=NEKA ALLA")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            pass
        
        for sidnummer in range(1, 20):
            print(f"Hämtar sida {sidnummer}...")
            page.goto(bas_url + str(sidnummer))
            page.wait_for_timeout(2000)
            
            kort = page.query_selector_all("h3.text-h3")
            
            if len(kort) == 0:
                print(f"Inga fler annonser på sida {sidnummer}, avslutar!")
                break
            
            for h3 in kort:
                try:
                    foralder = h3.evaluate_handle("el => el.closest('div.flex.w-full')")
                    foralder = foralder.as_element()
                    
                    if not foralder:
                        continue
                    
                    all_text = foralder.inner_text()
                    rader = [r.strip() for r in all_text.split("\n") if r.strip()]
                    
                    titel = h3.inner_text().strip()
                    titel = re.sub(r'\s*\(\d+-\d+-\d+\)', '', titel).strip()
                    
                    omrade = next((r for r in rader if r and r != titel and "rum" not in r and "kr" not in r and "202" not in r and "Lägenhet" not in r and "kvm" not in r), "Okänd")
                    omrade = re.sub(r'\s*\(\d+-\d+-\d+\)', '', omrade).strip()
                    
                    antal_rum_raw = next((r for r in rader if "rum" in r.lower()), "Okänd")
                    hyra_raw = next((r for r in rader if "kr/mån" in r.lower()), "Okänd")
                    ledig_raw = next((r for r in rader if "202" in r), "Okänd")
                    storlek_raw = next((r for r in rader if "kvm" in r.lower()), "Okänd")
                    
                    antal_rum = antal_rum_raw.replace("Antal rum", "").strip()
                    hyra = hyra_raw.replace("Hyra per månad", "").strip()
                    ledig = ledig_raw.replace("Ledig fr.o.m", "").strip()
                    storlek = storlek_raw if storlek_raw != "Okänd" else "Okänd"
                    
                    if "kr" in ledig:
                        ledig = "Okänd"
                    if "202" in hyra:
                        hyra = "Okänd"
                    
                    lank = foralder.query_selector("a[href*='/lediga-lagenheter/']")
                    href = lank.get_attribute("href") if lank else ""
                    
                    annons = {
                        "titel": titel,
                        "område": omrade,
                        "antal_rum": antal_rum,
                        "storlek": storlek,
                        "hyra": hyra,
                        "ledig": ledig,
                        "url": "https://www.mkbfastighet.se" + href if href else "",
                        "källa": "MKB"
                    }
                    annonser.append(annons)
                except:
                    pass
            
            print(f"Totalt hittills: {len(annonser)} annonser")
        
        browser.close()
    
    print(f"\nKlart! Hittade totalt {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_mkb()
    with open("annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat till annonser.json!")