from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    
    api_urls = []
    
    def handle_request(request):
        if "api" in request.url or "apartment" in request.url or "lagenhet" in request.url or "listing" in request.url:
            api_urls.append(request.url)
    
    page = context.new_page()
    page.on("request", handle_request)
    
    page.goto("https://www.mkbfastighet.se/vill-hyra/lediga-lagenheter/")
    page.wait_for_timeout(8000)
    
    browser.close()
    
    print("API-anrop hittade:")
    for url in api_urls:
        print(url)