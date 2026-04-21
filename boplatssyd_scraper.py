from playwright.sync_api import sync_playwright
import json
import re

def scrape_boplatssyd():
    annonser = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("Hämtar annonser från Boplats Syd...")
        page.goto("https://www.boplatssyd.se/mypages/app?filter=true")
        page.wait_for_timeout(8000)
        
        try:
            page.click("text=NEKA KAKOR")
            page.wait_for_timeout(2000)
            print("Cookie stängd!")
        except:
            pass
        
        page.wait_for_timeout(5000)
        
        kort = page.query_selector_all(".rental-object__item-title-link")
        print(f"Hittade {len(kort)} annonslänkar")
        
        alla_kort = page.query_selector_all(".rental-object_item, .g-0.mb-3, [class*='rental-object']")
        print(f"Hittade {len(alla_kort)} annonskort")
        
        kort = page.query_selector_all("h2.rental-object__item--address")
        print(f"Hittade {len(kort)} adresser")
        
        for h2 in kort:
            try:
                foralder = h2.evaluate_handle("el => el.closest('.row')")
                foralder = foralder.as_element()
                
                if not foralder:
                    continue
                
                all_text = foralder.inner_text()
                rader = [r.strip() for r in all_text.split("\n") if r.strip()]
                
                titel = h2.inner_text().strip()
                
                omrade_el = foralder.query_selector("span.h5.fw-normal")
                omrade = omrade_el.inner_text().strip() if omrade_el else "Okänd"
                
                lank = foralder.query_selector("a.rental-object__item-title-link")
                href = lank.get_attribute("href") if lank else ""
                
                spans = foralder.query_selector_all("span:not(.badge):not(.icon)")
                rum = "Okänd"
                hyra = "Okänd"
                storlek = "Okänd"
                ledig = "Okänd"
                
                for span in spans:
                    text = span.inner_text().strip()
                    if "rum" in text.lower():
                        rum = text
                    if "kr" in text.lower() and "•" not in text:
                        hyra = text
                    if "m²" in text:
                        storlek = text
                
                ledig_raw = next((r for r in rader if "2026" in r or "2027" in r), "Okänd")
                if "Inflyttning:" in ledig_raw:
                    ledig = ledig_raw.replace("Inflyttning:", "").strip()
                
                annons = {
                    "titel": titel,
                    "område": omrade,
                    "antal_rum": rum,
                    "storlek": storlek,
                    "hyra": hyra,
                    "ledig": ledig,
                    "url": "https://www.boplatssyd.se" + href if href else "",
                    "källa": "Boplats Syd"
                }
                annonser.append(annons)
            except Exception as e:
                print(f"Fel: {e}")
                pass
        
        browser.close()
    
    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_boplatssyd()
    with open("boplatssyd_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")