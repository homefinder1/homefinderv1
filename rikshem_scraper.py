from playwright.sync_api import sync_playwright
import json

def scrape_rikshem():
    annonser = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("Hämtar annonser från Rikshem...")
        page.goto("https://minasidor.rikshem.se/ledigt/lagenhet")
        page.wait_for_timeout(10000)

        try:
            page.click("button:has-text('Acceptera'), button:has-text('Godkänn'), button:has-text('Acceptera alla')")
            page.wait_for_timeout(3000)
            print("Cookie-banner stängd!")
        except:
            print("Ingen cookie-banner")

        page.wait_for_timeout(5000)

        # Printa URL efter eventuell redirect
        print(f"Aktuell URL: {page.url}")

        # Printa sidtitel
        print(f"Sidtitel: {page.title()}")

        # Debug HTML
        html = page.inner_html("body")
        print("DEBUG HTML (första 3000 tecken):")
        print(html[:3000])

    return annonser

if __name__ == "__main__":
    scrape_rikshem()
