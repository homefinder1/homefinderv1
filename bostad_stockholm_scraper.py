from playwright.sync_api import sync_playwright
import json
import re

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
        page.wait_for_timeout(4000)

        # Stäng cookie-banner om den finns
        try:
            page.click("button:has-text('Acceptera')")
            page.wait_for_timeout(1000)
        except:
            pass

        # Klicka på "Visa lista" för att få listvy
        try:
            page.click("text=Visa lista")
            page.wait_for_timeout(2000)
        except:
            pass

        sida = 1
        while True:
            print(f"Hämtar sida {sida}...")
            page.wait_for_timeout(2000)

            kort = page.query_selector_all("li.object-item, article.listing, div.apartment-item")

            if not kort:
                # Prova alternativa selektorer
                kort = page.query_selector_all("[class*='apartment'], [class*='listing'], [class*='bostad']")

            if not kort:
                print(f"Inga annonser hittade på sida {sida}, avslutar.")
                break

            for kort_item in kort:
                try:
                    text = kort_item.inner_text()
                    rader = [r.strip() for r in text.split("\n") if r.strip()]

                    # Hämta länk
                    lank = kort_item.query_selector("a")
                    href = lank.get_attribute("href") if lank else ""
                    full_url = "https://bostad.stockholm.se" + href if href and href.startswith("/") else href

                    # Titel = adress (första raden)
                    titel = rader[0] if rader else "Okänd"

                    # Hitta rum
                    antal_rum = next((r for r in rader if "rum" in r.lower()), "Okänd")

                    # Hitta yta
                    storlek = next((r for r in rader if "m²" in r or "kvm" in r.lower()), "Okänd")

                    # Hitta hyra
                    hyra = next((r for r in rader if "kr" in r.lower() and "mån" in r.lower()), "Okänd")

                    # Hitta område/stad
                    omrade = next((r for r in rader if any(s in r for s in ["Stockholm", "Solna", "Sundbyberg", "Lidingö", "Nacka", "Huddinge"])), "Stockholm")

                    # Hitta ledig från
                    ledig = next((r for r in rader if "202" in r), "Okänd")

                    # Hitta hyresvärd
                    kalla = "Bostadsförmedlingen Stockholm"
                    for rad in rader:
                        if "Stockholmshem" in rad:
                            kalla = "Stockholmshem"
                        elif "Svenska Bostäder" in rad:
                            kalla = "Svenska Bostäder"
                        elif "Familjebostäder" in rad:
                            kalla = "Familjebostäder"

                    if full_url:
                        annons = {
                            "titel": titel,
                            "område": omrade,
                            "antal_rum": antal_rum,
                            "storlek": storlek,
                            "hyra": hyra,
                            "ledig": ledig,
                            "url": full_url,
                            "källa": kalla
                        }
                        annonser.append(annons)
                except Exception as e:
                    pass

            print(f"Totalt hittills: {len(annonser)} annonser")

            # Nästa sida
            try:
                nasta = page.query_selector("a:has-text('Nästa'), button:has-text('Nästa'), [aria-label='Nästa']")
                if nasta:
                    nasta.click()
                    sida += 1
                    page.wait_for_timeout(3000)
                else:
                    print("Ingen nästa sida, klart!")
                    break
            except:
                break

            if sida > 50:  # Säkerhetsgräns
                break

        browser.close()

    print(f"\nKlart! Hittade totalt {len(annonser)} annonser")
    return annonser

if __name__ == "__main__":
    annonser = scrape_bostad_stockholm()
    with open("bostad_stockholm_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat till bostad_stockholm_annonser.json!")