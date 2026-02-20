
import os
import pickle
import pandas as pd
import numpy as np

# Este script asume que se ejecutará en el mismo entorno que el notebook, 
# pero como script aislado no tiene acceso a las variables del notebook 'rules', 'corr_matrix', etc.
# Por lo tanto, ESTE SCRIPT ES SOLO PARA COPIAR SU CONTENIDO AL NOTEBOOK, 
# o bien debería cargar los datos y re-entrenar (lo cual es redundante).

# CORRECCIÓN: Vamos a añadir una celda al notebook directamente o instruir al usuario.
# Sin embargo, como agente, puedo ejecutar código en el contexto del notebook si estuviera vivo, 
# pero aquí estoy ejecutando scripts independientes.

# ESTRATEGIA: Crear un script completo que cargue datos, entrene y guarde.
# Esto sirve como el script de entrenamiento para la API también (pipeline de entrenamiento).

import kagglehub
import glob
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules
from sklearn.decomposition import TruncatedSVD

def train_and_save_models():
    print("Iniciando pipeline de entrenamiento y guardado...")
    
    # 1. Cargar Datos
    print("Cargando datos...")
    try:
        path = kagglehub.dataset_download("tunguz/online-retail")
        csv_files = glob.glob(os.path.join(path, "*.csv"))
        if csv_files:
            try:
                df = pd.read_csv(csv_files[0], encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(csv_files[0], encoding='ISO-8859-1')
        else:
            excel_files = glob.glob(os.path.join(path, "*.xlsx"))
            df = pd.read_excel(excel_files[0])
            
        # Limpieza básica
        df = df.dropna(subset=['CustomerID'])
        df = df[~df['InvoiceNo'].astype(str).str.contains('C')]
        df['Description'] = df['Description'].str.strip()
        df['CustomerID'] = df['CustomerID'].astype(int)
    except Exception as e:
        print(f"Error cargando datos: {e}")
        return

    # Crear directorio
    save_path = os.path.join(os.path.dirname(__file__), '../app/services/models')
    os.makedirs(save_path, exist_ok=True)

    # --- MODELO 1: APRIORI (France) ---
    print("Entrenando Modelo de Reglas de Asociación...")
    country = 'France'
    basket = (df[df['Country'] == country]
            .groupby(['InvoiceNo', 'Description'])['Quantity']
            .sum().unstack().reset_index().fillna(0)
            .set_index('InvoiceNo'))
    
    def encode_units(x):
        if x <= 0: return 0
        if x >= 1: return 1
    
    basket_sets = basket.map(encode_units)
    if 'POSTAGE' in basket_sets.columns:
        basket_sets.drop('POSTAGE', inplace=True, axis=1)
        
    frequent_itemsets = apriori(basket_sets, min_support=0.07, use_colnames=True)
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1)
    
    # Guardar Reglas
    rules.to_pickle(os.path.join(save_path, "association_rules.pkl"))
    print("Reglas guardadas.")

    # --- MODELO 2: SVD ---
    print("Entrenando Modelo Filtro Colaborativo (SVD)...")
    user_item_matrix = df.pivot_table(index='CustomerID', columns='StockCode', values='Quantity', aggfunc='sum').fillna(0)
    user_item_matrix = user_item_matrix.map(lambda x: 1 if x > 0 else 0)
    
    SVD = TruncatedSVD(n_components=12, random_state=42)
    matrix_svd = SVD.fit_transform(user_item_matrix)
    corr_matrix = np.corrcoef(matrix_svd)
    
    # Guardar Matriz Correlación
    with open(os.path.join(save_path, "user_correlation_matrix.pkl"), "wb") as f:
        pickle.dump(corr_matrix, f)
        
    # Guardar Matriz Usuario-Item (Indices y Columnas para referencia)
    # Para ahorrar espacio, guardamos el dataframe tal cual (esparso sería mejor, pero esto cumple)
    user_item_matrix.to_pickle(os.path.join(save_path, "user_item_matrix.pkl"))
    
    # Guardar Catálogo
    product_catalog = df[['StockCode', 'Description']].drop_duplicates('StockCode').set_index('StockCode')
    product_catalog.to_pickle(os.path.join(save_path, "product_catalog.pkl"))
    
    print("Todos los modelos guardados en app/services/models")

if __name__ == "__main__":
    train_and_save_models()
