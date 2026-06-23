from playwright.sync_api import sync_playwright
import json
import re

def scrape_qasa():
    annonser = []
    sedda_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("Hämtar annonser från Qasa...")
        page.goto("https://qasa.com/se/sv/find-home?searchAreas=Sverige~~se&ne_lat=68.47075491176227&ne_lng=48.722038424563294&sw_lat=45.7219019899139&sw_lng=1.7825536388320131", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)

        try:
            page.click("button:has-text('Acceptera'), button:has-text('Godkänn'), button:has-text('Accept')")
            page.wait_for_timeout(2000)
            print("Cookie-banner stängd!")
        except:
            pass

        page.wait_for_timeout(3000)

        # Debug — se vad sidan innehåller
        for selector in ["a[href*='/home/']", "[class*='listing']", "[class*='card']", "[class*='Card']", "article"]:
            kort = page.query_selector_all(selector)
            print(f"Selector '{selector}': {len(kort)} element")

        html = page.inner_html("body")
        print("DEBUG HTML (första 3000 tecken):")
        print(html[:3000])

        browser.close()

    return annonser

if __name__ == "__main__":
    scrape_qasa()
