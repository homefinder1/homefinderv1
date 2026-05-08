from playwright.sync_api import sync_playwright
import json

def scrape_bostad_stockholm():
    annonser = []
    bas_url = "https://bostad.stockholm.se/bostad/"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("Laddar Bostadsförmedlingen Stockholm...")
        page.goto(bas_url)
        page.wait_for_timeout(8000)

        try:
            page.click("#onetrust-accept-btn-handler")
            page.wait_for_timeout(3000)
        except:
            pass

        try:
            page.click("button.filter-btn")
            page.wait_for_timeout(3000)
        except:
            pass

        try:
            page.wait_for_selector("li.ad-list__item", timeout=15000)
        except:
            print("Timeout - inga annonser hittades")
            browser.close()
            return annonser

        sida = 1
        while True:
            print(f"Hämtar sida {sida}...")
            page.wait_for_timeout(2000)

            kort = page.query_selector_all("li.ad-list__item")
            print(f"  Hittade {len(kort)} annonser")

            if not kort:
                print("Inga annonser hittades, avslutar.")
                break

            for kort_item in kort:
                try:
                    lank = kort_item.query_selector("a.ad-list__link")
                    href = lank.get_attribute("href") if lank else ""
                    full_url = "https://bostad.stockholm.se" + href if href else ""

                    omrade_el = kort_item.query_selector("small.apartment-listing__item__area")
                    omrade = omrade_el.inner_text().strip() if omrade_el else "Stockholm"
                    stad = omrade.split(",")[0].strip() if "," in omrade else omrade

                    titel_el = kort_item.query_selector("span.ad-list__title strong")
                    titel = titel_el.inner_text().strip() if titel_el else "Okänd"

                    data_spans = kort_item.query_selector_all("div.ad-list__data span")
                    hyra = "Okänd"
                    antal_rum = "Okänd"
                    storlek = "Okänd"

                    for span in data_spans:
                        text = span.inner_text().strip()
                        if "kr/mån" in text or "kr/m" in text.lower():
                            hyra = text
                        elif "rum" in text.lower():
                            antal_rum = text
                        elif "kvm" in text.lower():
                            storlek = text

                    footer_el = kort_item.query_selector("footer.ad-list__footer span")
                    ledig = footer_el.inner_text().strip() if footer_el else "Okänd"

                    if full_url:
                        annonser.append({
                            "titel": titel,
                            "område": stad,
                            "antal_rum": antal_rum,
                            "storlek": storlek,
                            "hyra": hyra,
                            "ledig": ledig,
                            "url": full_url,
                            "källa": "Bostadsförmedlingen Stockholm"
                        })
                except:
                    pass

            print(f"Totalt hittills: {len(annonser)} annonser")

            try:
                nasta = page.query_selector("a:has-text('Nästa')")
                if nasta:
                    nasta.click()
                    sida += 1
                    page.wait_for_timeout(3000)
                else:
                    print("Ingen nästa sida, klart!")
                    break
            except:
                break

            if sida > 30:
                break

        browser.close()

    print(f"\nKlart! Hittade totalt {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_bostad_stockholm()
    with open("bostad_stockholm_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat till bostad_stockholm_annonser.json!")