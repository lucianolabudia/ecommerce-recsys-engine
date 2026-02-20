"""
Script to translate product descriptions from English to Spanish.
Uses Google Translator (free, no API key needed) via deep-translator.
Saves a translation mapping dict as a pickle file.
"""
import pickle
import os
import time
import sys

from deep_translator import GoogleTranslator

# ─── Paths ────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "app", "services", "models")
CATALOG_PATH = os.path.join(MODEL_PATH, "product_catalog.pkl")
TRANSLATION_PATH = os.path.join(MODEL_PATH, "product_translations.pkl")

# ─── Load catalog ─────────────────────────────────────────────
print("📦 Loading product catalog...")
with open(CATALOG_PATH, "rb") as f:
    catalog = pickle.load(f)

# Get unique descriptions
unique_descriptions = catalog["Description"].dropna().unique().tolist()
# Clean up: strip whitespace, remove empty strings
unique_descriptions = [d.strip() for d in unique_descriptions if d and str(d).strip()]
unique_descriptions = list(set(unique_descriptions))
print(f"   Found {len(unique_descriptions)} unique descriptions to translate.")

# ─── Load existing translations if any ────────────────────────
translations = {}
if os.path.exists(TRANSLATION_PATH):
    with open(TRANSLATION_PATH, "rb") as f:
        translations = pickle.load(f)
    print(f"   Loaded {len(translations)} existing translations.")

# Filter out already translated
to_translate = [d for d in unique_descriptions if d not in translations]
print(f"   Remaining to translate: {len(to_translate)}")

if not to_translate:
    print("✅ All descriptions already translated!")
    sys.exit(0)

# ─── Translate in batches ─────────────────────────────────────
translator = GoogleTranslator(source="en", target="es")
BATCH_SIZE = 50  # Google Translate supports batch translations
SAVE_EVERY = 200  # Save progress every N translations

total = len(to_translate)
translated_count = 0
errors = 0

print(f"\n🔄 Translating {total} descriptions (batch size: {BATCH_SIZE})...")
print("   This may take a few minutes...\n")

for i in range(0, total, BATCH_SIZE):
    batch = to_translate[i:i + BATCH_SIZE]
    
    try:
        # Translate batch
        results = translator.translate_batch(batch)
        
        for original, translated in zip(batch, results):
            if translated:
                # Capitalize result to match style
                translations[original] = translated.title() if translated else original
            else:
                translations[original] = original
                
        translated_count += len(batch)
        
        # Progress
        pct = (translated_count / total) * 100
        print(f"   [{translated_count}/{total}] ({pct:.1f}%) translated...", end="\r")
        
        # Save periodically
        if translated_count % SAVE_EVERY < BATCH_SIZE:
            with open(TRANSLATION_PATH, "wb") as f:
                pickle.dump(translations, f)
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
        
    except Exception as e:
        errors += 1
        print(f"\n   ⚠️  Error translating batch {i}-{i+BATCH_SIZE}: {e}")
        # Try one by one for the failed batch
        for desc in batch:
            try:
                result = translator.translate(desc)
                translations[desc] = result.title() if result else desc
                translated_count += 1
            except Exception as e2:
                translations[desc] = desc  # Keep original on failure
                translated_count += 1
                errors += 1
            time.sleep(0.3)
        
        # Save after error recovery
        with open(TRANSLATION_PATH, "wb") as f:
            pickle.dump(translations, f)

# ─── Final save ───────────────────────────────────────────────
with open(TRANSLATION_PATH, "wb") as f:
    pickle.dump(translations, f)

print(f"\n\n✅ Translation complete!")
print(f"   Total translated: {len(translations)}")
print(f"   Errors: {errors}")
print(f"   Saved to: {TRANSLATION_PATH}")

# Show some examples
print("\n📋 Sample translations:")
for desc in list(translations.keys())[:10]:
    print(f"   EN: {desc}")
    print(f"   ES: {translations[desc]}")
    print()
