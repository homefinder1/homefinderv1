from playwright.sync_api import sync_playwright
import json

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

        # Försök hitta alla annonslänkar direkt
        lankar = page.query_selector_all("a.rental-object__item-title-link")
        print(f"Hittade {len(lankar)} annonslänkar")

        # Om inga länkbaserade kort — printa HTML för debug
        if len(lankar) == 0:
            html_snippet = page.inner_html("body")[:3000]
            print("DEBUG HTML:", html_snippet)
            browser.close()
            return []

        for lank in lankar:
            try:
                href = lank.get_attribute("href") or ""
                titel = lank.inner_text().strip()

                # Gå upp till föräldrakortet
                kort = lank.evaluate_handle("el => el.closest('.row') || el.closest('[class*=rental]') || el.parentElement.parentElement")
                kort = kort.as_element()

                all_text = kort.inner_text() if kort else ""
                rader = [r.strip() for r in all_text.split("\n") if r.strip()]

                rum = next((r for r in rader if "rum" in r.lower()), "Okänd")
                storlek = next((r for r in rader if "m²" in r or "kvm" in r.lower()), "Okänd")
                hyra = next((r for r in rader if "kr" in r.lower() and "rum" not in r.lower()), "Okänd")
                ledig = next((r for r in rader if "2026" in r or "2027" in r), "Okänd")
                if "Inflyttning:" in ledig:
                    ledig = ledig.replace("Inflyttning:", "").strip()

                omrade_el = kort.query_selector("span.h5, span.fw-normal, [class*='area'], [class*='district']") if kort else None
                omrade = omrade_el.inner_text().strip() if omrade_el else "Okänd"

                annonser.append({
                    "titel": titel,
                    "område": omrade,
                    "antal_rum": rum,
                    "storlek": storlek,
                    "hyra": hyra,
                    "ledig": ledig,
                    "url": "https://www.boplatssyd.se" + href if href else "",
                    "källa": "Boplats Syd"
                })
            except Exception as e:
                print(f"Fel: {e}")

        browser.close()
    
    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_boplatssyd()
    with open("boplatssyd_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")
