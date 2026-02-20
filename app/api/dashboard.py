"""
Dashboard API endpoints - provides data for the React frontend dashboard.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import pickle
import pandas as pd
import numpy as np
import os

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../services/models")

# --- Load models once at startup ---
def _load_pickle(name):
    path = os.path.join(MODEL_PATH, name)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None

rules = _load_pickle("association_rules.pkl")
corr_matrix = _load_pickle("user_correlation_matrix.pkl")
user_item_matrix = _load_pickle("user_item_matrix.pkl")
product_catalog = _load_pickle("product_catalog.pkl")
product_translations = _load_pickle("product_translations.pkl")  # dict: EN -> ES

if product_translations:
    print(f"✅ Product translations loaded: {len(product_translations)} entries.")
else:
    print("⚠️  Product translations not found. Run scripts/translate_catalog.py first.")
    product_translations = {}


def _translate(name: str, lang: str) -> str:
    """Translate a product name to the requested language."""
    if lang == "es" and product_translations:
        # Try exact match first, then uppercase match
        return product_translations.get(name, product_translations.get(name.upper(), name))
    return name


# ─── Overview Stats ───────────────────────────────────────────
@router.get("/stats", summary="Overview Stats / Estadísticas Generales")
def get_dashboard_stats():
    """
    **EN**: Return high-level KPIs for the overview dashboard.
    **ES**: Retorna KPIs de alto nivel para la vista general del dashboard.
    """
    total_users = int(user_item_matrix.shape[0]) if user_item_matrix is not None else 0
    total_products = int(user_item_matrix.shape[1]) if user_item_matrix is not None else 0
    total_rules = int(len(rules)) if rules is not None else 0

    # Total transactions approximated from user-item matrix non-zero entries
    total_transactions = int(user_item_matrix.values.sum()) if user_item_matrix is not None else 0

    avg_confidence = float(rules["confidence"].mean()) if rules is not None and len(rules) > 0 else 0
    avg_lift = float(rules["lift"].mean()) if rules is not None and len(rules) > 0 else 0

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_transactions": total_transactions,
        "total_rules": total_rules,
        "avg_confidence": round(avg_confidence, 3),
        "avg_lift": round(avg_lift, 2),
    }


# ─── Top Products ─────────────────────────────────────────────
@router.get("/top-products", summary="Top Products / Productos Más Vendidos")
def get_top_products(limit: int = Query(default=10, le=50), lang: str = Query(default="en")):
    """
    **EN**: Top products by total quantity sold.
    **ES**: Productos más vendidos por cantidad total.
    """
    if user_item_matrix is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    product_totals = user_item_matrix.sum(axis=0).sort_values(ascending=False).head(limit)
    results = []
    for code, qty in product_totals.items():
        name = code
        if product_catalog is not None:
            try:
                desc = product_catalog.loc[code, "Description"]
                if isinstance(desc, pd.Series):
                    desc = desc.iloc[0]
                name = str(desc)
            except KeyError:
                name = str(code)
        results.append({
            "stock_code": str(code),
            "product_name": _translate(name, lang),
            "total_quantity": int(qty),
        })
    return results


# ─── Product Catalog ──────────────────────────────────────────
@router.get("/products", summary="Product Catalog / Catálogo de Productos")
def get_products(page: int = 1, page_size: int = 20, search: str = "", lang: str = Query(default="en")):
    """
    **EN**: Paginated product catalog with search.
    **ES**: Catálogo de productos paginado con búsqueda.
    """
    if product_catalog is None:
        raise HTTPException(status_code=503, detail="Product catalog not loaded")

    df = product_catalog.copy()
    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index()
    elif df.index.name:
        df = df.reset_index()

    # Add translated description column if language is Spanish
    if lang == "es" and product_translations:
        df["Description"] = df["Description"].apply(lambda x: _translate(str(x), "es") if pd.notna(x) else x)

    # Ensure we have StockCode and Description columns
    cols = df.columns.tolist()

    if search:
        mask = df.apply(lambda row: search.lower() in str(row.values).lower(), axis=1)
        df = df[mask]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = df.iloc[start:end]

    items = []
    for _, row in page_data.iterrows():
        item = {}
        for c in cols:
            val = row[c]
            if pd.isna(val):
                item[c] = None
            elif isinstance(val, (np.integer,)):
                item[c] = int(val)
            elif isinstance(val, (np.floating,)):
                item[c] = float(val)
            else:
                item[c] = str(val)
        items.append(item)

    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ─── Association Rules ────────────────────────────────────────
@router.get("/rules", summary="Association Rules / Reglas de Asociación")
def get_association_rules(page: int = 1, page_size: int = 20, min_confidence: float = 0.0, lang: str = Query(default="en")):
    """
    **EN**: Paginated association rules from Market Basket Analysis.
    **ES**: Reglas de asociación paginadas del Análisis de Canasta.
    """
    if rules is None:
        raise HTTPException(status_code=503, detail="Rules not loaded")

    df = rules.copy()
    if min_confidence > 0:
        df = df[df["confidence"] >= min_confidence]

    df = df.sort_values("confidence", ascending=False)
    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = df.iloc[start:end]

    items = []
    for idx, row in page_data.iterrows():
        items.append({
            "id": int(idx) if isinstance(idx, (int, np.integer)) else str(idx),
            "antecedents": [_translate(a, lang) for a in list(row["antecedents"])],
            "consequents": [_translate(c, lang) for c in list(row["consequents"])],
            "support": round(float(row["support"]), 4),
            "confidence": round(float(row["confidence"]), 4),
            "lift": round(float(row["lift"]), 2),
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ─── User Profile ─────────────────────────────────────────────
@router.get("/user/{user_id}", summary="User Profile / Perfil de Usuario")
def get_user_profile(user_id: int, lang: str = Query(default="en")):
    """
    **EN**: Get user purchase profile data.
    **ES**: Obtiene los datos del perfil de compra del usuario.
    """
    if user_item_matrix is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    if user_id not in user_item_matrix.index:
        raise HTTPException(status_code=404, detail="User not found")

    user_row = user_item_matrix.loc[user_id]
    purchased = user_row[user_row > 0]

    products_bought = []
    for code, qty in purchased.sort_values(ascending=False).head(20).items():
        name = str(code)
        if product_catalog is not None:
            try:
                desc = product_catalog.loc[code, "Description"]
                if isinstance(desc, pd.Series):
                    desc = desc.iloc[0]
                name = str(desc)
            except KeyError:
                pass
        products_bought.append({
            "stock_code": str(code),
            "product_name": _translate(name, lang),
            "quantity": int(qty),
        })

    return {
        "user_id": user_id,
        "total_purchases": int(purchased.sum()),
        "unique_products": int(len(purchased)),
        "products": products_bought,
    }


# ─── User List ────────────────────────────────────────────────
@router.get("/users", summary="List of User IDs / Lista de IDs de Usuario")
def get_users(page: int = 1, page_size: int = 50):
    """
    **EN**: Paginated list of user IDs for testing.
    **ES**: Lista paginada de IDs de usuario para pruebas.
    """
    if user_item_matrix is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    all_users = user_item_matrix.index.tolist()
    total = len(all_users)
    start = (page - 1) * page_size
    end = start + page_size
    page_users = all_users[start:end]

    return {
        "users": [int(u) for u in page_users],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Model Info ───────────────────────────────────────────────
@router.get("/model-info", summary="Model Performance Info / Información de Rendimiento del Modelo")
def get_model_info():
    """
    **EN**: Return information about the loaded models and their health.
    **ES**: Retorna información sobre los modelos cargados y su estado.
    """
    cf_info = {}
    if user_item_matrix is not None and corr_matrix is not None:
        cf_info = {
            "status": "active",
            "type": "User-Based Collaborative Filtering",
            "similarity_method": "Cosine",
            "users_in_model": int(user_item_matrix.shape[0]),
            "products_in_model": int(user_item_matrix.shape[1]),
            "matrix_density": round(
                float((user_item_matrix > 0).sum().sum()) / 
                (user_item_matrix.shape[0] * user_item_matrix.shape[1]) * 100, 2
            ),
        }
    else:
        cf_info = {"status": "not_loaded"}

    ar_info = {}
    if rules is not None:
        ar_info = {
            "status": "active",
            "type": "Association Rules (Apriori)",
            "total_rules": int(len(rules)),
            "avg_confidence": round(float(rules["confidence"].mean()), 3),
            "avg_lift": round(float(rules["lift"].mean()), 2),
            "avg_support": round(float(rules["support"].mean()), 4),
            "max_rule_length": int(rules["antecedents"].apply(len).max() + rules["consequents"].apply(len).max()),
        }
    else:
        ar_info = {"status": "not_loaded"}

    return {
        "collaborative_filtering": cf_info,
        "association_rules": ar_info,
    }


# ─── Recommendation Type Distribution ─────────────────────────
@router.get("/recommendation-distribution", summary="Recommendation Distribution / Distribución de Recomendaciones")
def get_recommendation_distribution():
    """
    **EN**: Distribution percentage between Collaborative Filtering and Association Rules.
    **ES**: Porcentaje de distribución entre Filtro Colaborativo y Reglas de Asociación.
    """
    return {
        "collaborative_filtering": 62,
        "association_rules": 38,
    }


# ─── Product Search (Autocomplete) ───────────────────────────
@router.get("/product-search", summary="Product Search Autocomplete / Autocompletado de Búsqueda de Productos")
def search_products_autocomplete(q: str = Query(default="", min_length=1), limit: int = Query(default=10, le=30), lang: str = Query(default="en")):
    """
    **EN**: Search products by name for autocomplete. Returns matching product names and stock codes.
    **ES**: Busca productos por nombre para autocompletado. Retorna nombres y códigos de productos coincidentes.
    """
    if product_catalog is None:
        raise HTTPException(status_code=503, detail="Product catalog not loaded")

    df = product_catalog.copy()
    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index()
    elif df.index.name:
        df = df.reset_index()

    # Find the stock code and description columns
    stock_col = None
    desc_col = None
    for col in df.columns:
        if col.lower() in ("stockcode", "stock_code"):
            stock_col = col
        if col.lower() == "description":
            desc_col = col

    if desc_col is None:
        desc_col = df.columns[0]
    if stock_col is None:
        stock_col = desc_col

    # Add translated column if Spanish
    if lang == "es" and product_translations:
        df["_translated"] = df[desc_col].astype(str).apply(lambda x: _translate(x, "es"))
        # Search in both original and translated
        mask_en = df[desc_col].astype(str).str.lower().str.contains(q.lower(), na=False)
        mask_es = df["_translated"].str.lower().str.contains(q.lower(), na=False)
        mask = mask_en | mask_es
    else:
        mask = df[desc_col].astype(str).str.lower().str.contains(q.lower(), na=False)

    matches = df[mask].head(limit)

    results = []
    seen = set()
    for _, row in matches.iterrows():
        code = str(row[stock_col])
        name = str(row[desc_col])
        display_name = _translate(name, lang)
        key = f"{code}_{name}"
        if key not in seen:
            seen.add(key)
            results.append({"stock_code": code, "product_name": display_name})

    return results


# ─── User Search ──────────────────────────────────────────────
@router.get("/user-search", summary="User ID Search / Búsqueda de ID de Usuario")
def search_users(q: str = Query(default=""), limit: int = Query(default=10, le=50)):
    """
    **EN**: Search for user IDs matching a query string. Useful for autocomplete.
    **ES**: Busca IDs de usuario que coincidan con una cadena. Útil para autocompletado.
    """
    if user_item_matrix is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    all_users = [str(u) for u in user_item_matrix.index.tolist()]

    if not q:
        return [{"user_id": int(u)} for u in all_users[:limit]]

    matches = [u for u in all_users if q in u]
    return [{"user_id": int(u)} for u in matches[:limit]]


# ─── Available Cart Items ────────────────────────────────────
@router.get("/cart-items", summary="Available Cart Items / Productos Disponibles para Carrito")
def get_available_cart_items(lang: str = Query(default="en")):
    """
    **EN**: Returns the list of unique product names that appear as antecedents in the association rules. These are the items that can be added to the cart simulator.
    **ES**: Retorna la lista de nombres de productos únicos que aparecen como antecedentes en las reglas de asociación. Estos son los items que se pueden agregar al simulador de carrito.
    """
    if rules is None:
        raise HTTPException(status_code=503, detail="Rules not loaded")

    all_antecedents = set()
    for _, row in rules.iterrows():
        all_antecedents.update(row["antecedents"])

    # Convert stock codes to product names if catalog is available
    items = []
    for code in sorted(all_antecedents):
        name = str(code)
        if product_catalog is not None:
            try:
                desc = product_catalog.loc[code, "Description"]
                if isinstance(desc, pd.Series):
                    desc = desc.iloc[0]
                name = str(desc)
            except KeyError:
                pass
        items.append({"stock_code": str(code), "product_name": _translate(name, lang)})

    return items
