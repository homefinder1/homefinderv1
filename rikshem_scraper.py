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
        page.goto("https://minasidor.rikshem.se/ledigt/lagenhet")
        page.wait_for_timeout(8000)

        try:
            page.click("#CybotCookiebotDialogBodyButtonDecline")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            pass

        page.wait_for_timeout(5000)

        sidnummer = 1
        while True:
            print(f"Hämtar sida {sidnummer}...")
            
            kort = page.query_selector_all("[class*='object']")
            
            for kort_el in kort:
                try:
                    text = kort_el.inner_text().strip()
                    
                    # Identifiera annonskort — de innehåller "Antal rum" och "Hyra"
                    if "Antal rum" not in text or "Hyra" not in text:
                        continue

                    # Hitta länk
                    lank = kort_el.query_selector("a")
                    href = lank.get_attribute("href") if lank else ""
                    full_url = "https://minasidor.rikshem.se" + href if href and href.startswith("/") else href or ""

                    if not full_url or full_url in sedda_urls:
                        continue
                    sedda_urls.add(full_url)

                    # Parsa med regex
                    titel_match = re.match(r'^(.+?)(?:Helsingborg|Malmö|Stockholm|Göteborg|Uppsala|Lund|Umeå|Luleå|Östersund|Västerås|Norrköping|Kalmar|Halmstad|Södertälje|Ale)', text)
                    titel = titel_match.group(1).strip() if titel_match else text[:30]

                    omrade_match = re.search(r'(Helsingborg[^A-Z]*|Malmö[^A-Z]*|Stockholm[^A-Z]*|Uppsala[^A-Z]*|Lund[^A-Z]*|Umeå[^A-Z]*|Luleå[^A-Z]*|Östersund[^A-Z]*|Västerås[^A-Z]*|Norrköping[^A-Z]*|Kalmar[^A-Z]*|Halmstad[^A-Z]*|Södertälje[^A-Z]*|Ale[^A-Z]*)Antal rum', text)
                    omrade = omrade_match.group(1).strip() if omrade_match else "Okänd"

                    rum_match = re.search(r'Antal rum(\d+)', text)
                    rum = rum_match.group(1) + " rum" if rum_match else "Okänd"

                    storlek_match = re.search(r'Storlek(\d+)', text)
                    storlek = storlek_match.group(1) + " kvm" if storlek_match else "Okänd"

                    hyra_match = re.search(r'Hyra([\d\s\xa0]+)Tillträde', text)
                    hyra = hyra_match.group(1).replace('\xa0', '').strip() + " kr/mån" if hyra_match else "Okänd"

                    ledig_match = re.search(r'Tillträde(\d{4}-\d{2}-\d{2}|Flexibelt)', text)
                    ledig = ledig_match.group(1) if ledig_match else "Okänd"

                    # Försök hitta stad
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

            # Gå till nästa sida
            try:
                nasta = page.query_selector("a[aria-label='Nästa sida'], a:has-text('Nästa'), .pagination-next a, a[rel='next']")
                if not nasta:
                    # Försök klicka på nästa sidnummer
                    nasta = page.query_selector(f"a:has-text('{sidnummer + 1}')")
                
                if not nasta:
                    print("Ingen nästa sida, avslutar!")
                    break

                nasta.click()
                page.wait_for_timeout(3000)
                sidnummer += 1
            except Exception as e:
                print(f"Paginering fel: {e}")
                break

        browser.close()

    print(f"Hittade {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_rikshem()
    with open("rikshem_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat!")
