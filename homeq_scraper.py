import requests
import json

def scrape_homeq():
    print("Hämtar annonser från HomeQ...")
    
    payload = {
        "min_lat": 49.66,
        "max_lat": 69.02,
        "min_lng": -7.77,
        "max_lng": 46.40,
        "zoom": 4
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
    
    response = requests.post(
        "https://api.homeq.se/api/v3/search",
        json=payload,
        headers=headers
    )
    
    data = response.json()
    resultat = data.get("results", [])
    print(f"Hittade {len(resultat)} annonser")
    
    annonser = []
    for r in resultat:
        annons = {
            "titel": r.get("title", "Okänd"),
            "område": r.get("city", "Okänd"),
            "antal_rum": f"{int(r['rooms'])} rum" if r.get("rooms") else "Okänd",
            "storlek": f"{int(r['area'])} m²" if r.get("area") else "Okänd",
            "hyra": f"{r['rent']} kr/mån" if r.get("rent") else "Okänd",
            "ledig": r.get("date_access", "Okänd"),
            "url": "https://www.homeq.se" + r.get("uri", ""),
            "källa": "HomeQ"
        }
        annonser.append(annons)
    
    print(f"Sparar {len(annonser)} annonser...")
    return annonser

if __name__ == "__main__":
    annonser = scrape_homeq()
    with open("homeq_annonser.json", "w", encoding="utf-8") as f:
        json.dump(annonser, f, ensure_ascii=False, indent=2)
    print("Sparat till homeq_annonser.json!")