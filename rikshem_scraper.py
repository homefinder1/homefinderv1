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

        # Stäng CybotCookiebot
        try:
            page.click("#CybotCookiebotDialogBodyButtonDecline")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            try:
                page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
                page.wait_for_timeout(2000)
                print("Cookie-banner accepterad!")
            except:
                print("Ingen cookie-banner")

        page.wait_for_timeout(5000)

        print(f"Aktuell URL: {page.url}")

        # Prova olika selektorer
        for selector in ["a[href*='lagenhet']", "[class*='listing']", "[class*='apartment']", "[class*='object']", "article", ".card", "li a"]:
            kort = page.query_selector_all(selector)
            print(f"Selector '{selector}': {len(kort)} element")

        html = page.inner_html("body")
        print("DEBUG HTML (3000-6000 tecken):")
        print(html[3000:6000])

    return annonser

if __name__ == "__main__":
    scrape_rikshem()
