from playwright.sync_api import sync_playwright
import json

def scrape_boplats():
    annonser = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("Hämtar annonser från Boplats...")
        page.goto("https://boplats.se/sok?types=1hand")
        page.wait_for_timeout(5000)
        
        try:
            page.click("text=Godkänn nödvändiga kakor")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            pass
        
        page.wait_for_timeout(3000)
        
        kort = page.query_selector_all(".search-listing")
        print(f"Hittade {len(kort)} annonskort")
        
        for kort in kort:
            try:
                område = kort.query_selector(".search-result-area-name")
                hyra = kort.query_selector(".search-result-price")
                adress = kort.query_selector(".search-result-address")
                rum_elements = kort.query_selector_all(".pure-u-1-4.right-align")
                lank = kort.query_selector(".search-result-link")
                
                rum = rum_elements[0].inner_text().strip() if rum_elements else "Okänd"
                href = lank.get_attribute("href") if lank else ""
                
                hyra_text = hyra.inner_text().strip().replace("\xa0", " ") if hyra else "Okänd"
                
                annons = {
                    "titel": adress.inner_text().strip() if adress else "Okänd",
                    "område": område.inner_text().strip() if område else "Okänd",
                    "antal_rum": rum,
                    "storlek": "Okänd",
                    "hyra": hyra_text,
                    "ledig": "Förstahand",
                    "url": href if href.startswith("http") else "https://boplats.se" + href,
                    "källa": "Boplats"
                }
                annonser.append(annons)
            except:
                pass
        
        browser.close()
    
    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_boplats()
    with open("boplats_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat till boplats_annonser.json!")