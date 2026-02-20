
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import pickle
import pandas as pd
import numpy as np
import os
import glob

router = APIRouter()

# --- Carga de Modelos ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../services/models")

try:
    with open(os.path.join(MODEL_PATH, "association_rules.pkl"), "rb") as f:
        rules = pickle.load(f)
    print("Reglas de asociación cargadas.")

    with open(os.path.join(MODEL_PATH, "user_correlation_matrix.pkl"), "rb") as f:
        corr_matrix = pickle.load(f)
    print("Matriz de correlación cargada.")

    # Cargar matriz usuario-item para saber qué compraron
    with open(os.path.join(MODEL_PATH, "user_item_matrix.pkl"), "rb") as f:
        user_item_matrix = pickle.load(f)
    print("Matriz usuario-item cargada.")

    with open(os.path.join(MODEL_PATH, "product_catalog.pkl"), "rb") as f:
        product_catalog = pickle.load(f)
    print("Catálogo de productos cargado.")
    
except FileNotFoundError as e:
    print(f"Error cargando modelos: {e}. Asegúrese de ejecutar el script de entrenamiento primero.")
    rules = None
    corr_matrix = None
    user_item_matrix = None
    product_catalog = None

# --- Load translations ---
translations_path = os.path.join(MODEL_PATH, "product_translations.pkl")
product_translations = {}
if os.path.exists(translations_path):
    with open(translations_path, "rb") as f:
        product_translations = pickle.load(f)
    print(f"✅ Traducciones cargadas: {len(product_translations)} entradas.")
else:
    print("⚠️  Traducciones no encontradas. Ejecute scripts/translate_catalog.py.")


def _translate(name: str, lang: str) -> str:
    """Translate a product name to the requested language."""
    if lang == "es" and product_translations:
        return product_translations.get(name, product_translations.get(name.upper(), name))
    return name


# --- Schemas ---
class RecommendationRequest(BaseModel):
    user_id: int
    top_n: int = 5

class AssociationRequest(BaseModel):
    cart_items: List[str] # Lista de nombres de productos o IDs
    top_n: int = 3

class ProductRecommendation(BaseModel):
    rank: int
    product_name: str
    score: Optional[float] = None # Confianza o similitud

# --- Endpoints ---

@router.get("/user/{user_id}", response_model=List[ProductRecommendation], summary="Personalized User Recommendations / Recomendaciones Personalizadas de Usuario")
def recommend_user(user_id: int, top_n: int = 5, lang: str = Query(default="en")):
    """
    **EN**: Get personalized recommendations using Collaborative Filtering.
    **ES**: Obtiene recomendaciones personalizadas usando Filtro Colaborativo.
    """
    if corr_matrix is None or user_item_matrix is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados")
    
    if user_id not in user_item_matrix.index:
         raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Lógica de recomendación (copiada y adaptada del notebook)
    user_idx = list(user_item_matrix.index).index(user_id)
    
    # Top similares
    similar_users_indices = corr_matrix[user_idx].argsort()[::-1][1:6]
    
    recommended_products = []
    for similar_idx in similar_users_indices:
        # Productos que compraron los vecinos
        vecino_series = user_item_matrix.iloc[similar_idx]
        products_bought = vecino_series[vecino_series > 0].index.tolist()
        
        # Productos que ya compró el usuario objetivo
        user_series = user_item_matrix.iloc[user_idx]
        already_bought = user_series[user_series > 0].index.tolist()
        
        new_recs = [p for p in products_bought if p not in already_bought]
        recommended_products.extend(new_recs)
        
    from collections import Counter
    rec_counts = Counter(recommended_products)
    top_recs_codes = [code for code, count in rec_counts.most_common(top_n)]
    
    # Formatear respuesta
    results = []
    for i, code in enumerate(top_recs_codes):
        # Buscar nombre en catálogo
        try:
            name = product_catalog.loc[code, 'Description']
            # Si hay duplicados puede devolver series, tomamos el primero
            if isinstance(name, pd.Series):
                name = name.iloc[0]
        except KeyError:
            name = f"Unknown Product ({code})"
            
        results.append(ProductRecommendation(rank=i+1, product_name=_translate(str(name), lang), score=rec_counts[code]))
        
    return results

@router.post("/association", response_model=List[ProductRecommendation], summary="Recommendations by Cart / Recomendaciones por Carrito")
def recommend_association(request: AssociationRequest, lang: str = Query(default="en")):
    """
    **EN**: Get recommendations based on items in the cart.
    **ES**: Obtiene recomendaciones basadas en los productos del carrito.
    """
    if rules is None:
        raise HTTPException(status_code=503, detail="Modelo de reglas no cargado")
    
    recommendations = []
    
    # Buscar reglas donde los antecedentes estén en el carrito
    # Simplificación: Buscamos reglas donde el antecedente sea EXACTAMENTE uno de los items del carrito
    # Una implementación más compleja buscaría subconjuntos.
    
    cart_set = set(request.cart_items)
    
    # Filtrar reglas relevantes
    # rules['antecedents'] es un frozenset
    relevant_rules = rules[rules['antecedents'].apply(lambda x: len(x.intersection(cart_set)) > 0)]
    
    # Ordenar por confianza y lift
    relevant_rules = relevant_rules.sort_values(by=['confidence', 'lift'], ascending=False)
    
    seen_products = set(request.cart_items)
    rank = 1
    
    for _, row in relevant_rules.iterrows():
        consequents = list(row['consequents'])
        for product in consequents:
            if product not in seen_products:
                recommendations.append(ProductRecommendation(
                    rank=rank,
                    product_name=_translate(str(product), lang),
                    score=row['confidence']
                ))
                seen_products.add(product)
                rank += 1
                if rank > request.top_n:
                    break
        if rank > request.top_n:
            break
            
    return recommendations
