from playwright.sync_api import sync_playwright
import json

def scrape_rikshem():
    api_data = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Fånga nätverkstrafik
        api_responses = []
        def handle_response(response):
            if "json" in response.headers.get("content-type", "") and any(x in response.url for x in ["api", "ledigt", "lagenhet", "object", "search"]):
                try:
                    data = response.json()
                    api_responses.append({"url": response.url, "data": data})
                    print(f"API-anrop: {response.url}")
                except:
                    pass

        page = context.new_page()
        page.on("response", handle_response)

        page.goto("https://minasidor.rikshem.se/ledigt/lagenhet")
        page.wait_for_timeout(10000)

        try:
            page.click("#CybotCookiebotDialogBodyButtonDecline")
            page.wait_for_timeout(2000)
        except:
            pass

        page.wait_for_timeout(5000)

        print(f"\nHittade {len(api_responses)} API-anrop")
        for r in api_responses[:5]:
            print(f"URL: {r['url']}")
            print(f"Data (första 500 tecken): {str(r['data'])[:500]}")
            print("---")

        browser.close()

    return []

if __name__ == "__main__":
    scrape_rikshem()
