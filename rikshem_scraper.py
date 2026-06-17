from playwright.sync_api import sync_playwright
import json
import re

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
        page.goto("https://minasidor.rikshem.se/ledigt/lagenhet", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)

        try:
            page.click("#CybotCookiebotDialogBodyButtonDecline")
            page.wait_for_timeout(1000)
            print("Cookie-banner stängd!")
        except:
            pass

        sidnummer = 1
        while sidnummer <= 30:
            print(f"Hämtar sida {sidnummer}...")

            kort = page.query_selector_all("[class*='object']")
            har_annonser = False

            for kort_el in kort:
                try:
                    text = kort_el.inner_text().strip()
                    if "Antal rum" not in text or "Hyra" not in text:
                        continue

                    har_annonser = True

                    lank = kort_el.query_selector("a")
                    href = lank.get_attribute("href") if lank else ""
                    full_url = "https://minasidor.rikshem.se" + href if href and href.startswith("/") else href or ""

                    if not full_url or full_url in sedda_urls:
                        continue
                    sedda_urls.add(full_url)

                    rum_match = re.search(r'Antal rum(\d+)', text)
                    rum = rum_match.group(1) + " rum" if rum_match else "Okänd"

                    storlek_match = re.search(r'Storlek(\d+)', text)
                    storlek = storlek_match.group(1) + " kvm" if storlek_match else "Okänd"

                    hyra_match = re.search(r'Hyra([\d\s\xa0]+)Tillträde', text)
                    hyra = hyra_match.group(1).replace('\xa0', '').strip() + " kr/mån" if hyra_match else "Okänd"

                    ledig_match = re.search(r'Tillträde(\d{4}-\d{2}-\d{2}|Flexibelt)', text)
                    ledig = ledig_match.group(1) if ledig_match else "Okänd"

                    titel_match = re.match(r'^(.+?)(?:Helsingborg|Malmö|Stockholm|Uppsala|Lund|Umeå|Luleå|Östersund|Västerås|Norrköping|Kalmar|Halmstad|Södertälje|Ale)', text)
                    titel = titel_match.group(1).strip() if titel_match else text[:30]

                    omrade_match = re.search(r'((?:Helsingborg|Malmö|Stockholm|Uppsala|Lund|Umeå|Luleå|Östersund|Västerås|Norrköping|Kalmar|Halmstad|Södertälje|Ale)[^A-ZÅÄÖ]*)Antal rum', text)
                    omrade = omrade_match.group(1).strip() if omrade_match else "Okänd"

                    stad = "Okänd"
                    for s in ["Helsingborg", "Malmö", "Stockholm", "Uppsala", "Lund", "Umeå", "Luleå", "Östersund", "Västerås", "Norrköping", "Kalmar", "Halmstad", "Södertälje"]:
                        if s in text:
                            stad = s
                            break

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

            if not har_annonser:
                print(f"Inga fler annonser på sida {sidnummer}, avslutar!")
                break

            sidnummer += 1
            page.goto(f"https://minasidor.rikshem.se/ledigt/lagenhet?page={sidnummer}", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)

        browser.close()

    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_rikshem()
    with open("rikshem_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")
