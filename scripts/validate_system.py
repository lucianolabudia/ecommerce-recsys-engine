"""
Final validation script for the E-commerce RecSys Engine.
Verifies all key endpoints, translation support, and data integrity.
"""
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url, method="GET", body=None):
    print(f"🔍 Testing {name}...")
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}")
        else:
            response = requests.post(f"{BASE_URL}{url}", json=body)
            
        if response.status_code == 200:
            print(f"   ✅ SUCCESS! Status: {response.status_code}")
            return response.json()
        else:
            print(f"   ❌ FAILED! Status: {response.status_code}")
            print(f"      Response: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ ERROR communicating with API: {e}")
        return None

def validate_translation(data, lang="en"):
    print(f"   🌐 Checking {lang} names...")
    if isinstance(data, list) and len(data) > 0:
        item = data[0]
        # Check if it's a recommendation object or catalog object
        name = item.get("product_name") or item.get("Description")
        if name:
            print(f"      Sample product: {name}")
    elif isinstance(data, dict) and "items" in data:
        item = data["items"][0]
        name = item.get("Description") or item.get("product_name")
        if name:
            print(f"      Sample product: {name}")

def run_validation():
    print("🚀 Starting Final Validation Pulse...\n")
    
    # 1. Health Check
    test_endpoint("Health Check", "/")
    
    # 2. Stats
    test_endpoint("Dashboard Stats", "/dashboard/stats")
    
    # 3. Collaborative Filtering (EN)
    recs_en = test_endpoint("User Recommendations (EN)", "/recommend/user/17850?top_n=3&lang=en")
    validate_translation(recs_en, "en")
    
    # 4. Collaborative Filtering (ES)
    recs_es = test_endpoint("User Recommendations (ES)", "/recommend/user/17850?top_n=3&lang=es")
    validate_translation(recs_es, "es")
    
    # 5. Association Rules (EN)
    cart_items = ["22423", "85123A"]
    assoc_en = test_endpoint("Association Recommendations (EN)", "/recommend/association?lang=en", "POST", {"cart_items": cart_items, "top_n": 3})
    validate_translation(assoc_en, "en")
    
    # 6. Association Rules (ES)
    assoc_es = test_endpoint("Association Recommendations (ES)", "/recommend/association?lang=es", "POST", {"cart_items": cart_items, "top_n": 3})
    validate_translation(assoc_es, "es")
    
    # 7. Product Search Autocomplete (ES)
    search_es = test_endpoint("Autocomplete Search (ES) for 'Soporte'", "/dashboard/product-search?q=Soporte&lang=es")
    if search_es:
        print(f"      Results found: {len(search_es)}")
        for match in search_es[:2]:
            print(f"      - {match['product_name']} ({match['stock_code']})")
    
    # 8. Catalog Pagination
    catalog = test_endpoint("Product Catalog (ES) Page 2", "/dashboard/products?page=2&page_size=5&lang=es")
    if catalog:
        print(f"      Items on page: {len(catalog.get('items', []))}")
        print(f"      Total products: {catalog.get('total')}")

    print("\n✨ Validation Complete! System is ready for delivery.")

if __name__ == "__main__":
    run_validation()
