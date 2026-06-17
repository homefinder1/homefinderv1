from playwright.sync_api import sync_playwright
import json

def scrape_rikshem():
    annonser = []
    sedda_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("Hämtar annonser från Rikshem...")
        page.goto("https://minasidor.rikshem.se/ledigt/lagenhet")
        page.wait_for_timeout(8000)

        try:
            page.click("#CybotCookiebotDialogBodyButtonDecline")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            pass

        page.wait_for_timeout(5000)

        kort = page.query_selector_all("[class*='object']")
        print(f"Hittade {len(kort)} annonskort")

        for kort_el in kort:
            try:
                all_text = kort_el.inner_text().strip()
                rader = [r.strip() for r in all_text.split("\n") if r.strip()]

                if not rader:
                    continue

                print(f"DEBUG kort: {rader}")

                lank = kort_el.query_selector("a")
                href = lank.get_attribute("href") if lank else ""
                full_url = "https://minasidor.rikshem.se" + href if href and href.startswith("/") else href or ""

                if not full_url or full_url in sedda_urls:
                    continue
                sedda_urls.add(full_url)

                titel = rader[0] if rader else "Okänd"
                omrade = rader[1] if len(rader) > 1 else "Okänd"
                rum = next((r for r in rader if "rum" in r.lower()), "Okänd")
                storlek = next((r for r in rader if "m²" in r or "kvm" in r.lower()), "Okänd")
                hyra = next((r for r in rader if "kr" in r.lower()), "Okänd")
                ledig = next((r for r in rader if "202" in r), "Okänd")

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
            except Exception as e:
                print(f"Fel: {e}")

        browser.close()

    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_rikshem()
    with open("rikshem_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")
