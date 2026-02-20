
# 4. Guardado de Modelos y Datos
# Guardamos los artefactos necesarios para la API
import pickle

# Crear directorio de modelos si no existe
os.makedirs('../app/services/models', exist_ok=True)

# 1. Guardar Reglas de Asociación
rules.to_pickle("../app/services/models/association_rules.pkl")

# 2. Guardar Matriz de Correlación de Usuarios (SVD)
# Nota: En producción idealmente se recalcula o se usa una base de datos vectorial, 
# pero para este MVP guardamos la matriz numpy.
with open("../app/services/models/user_correlation_matrix.pkl", "wb") as f:
    pickle.dump(corr_matrix, f)

# 3. Guardar Matriz Usuario-Item (necesaria para filtrar qué ya compró el usuario)
# Guardamos solo los índices y columnas para ahorrar espacio si es posible, 
# pero necesitamos los datos para saber qué compró. 
# Para optimizar, podríamos guardar una versión esparsa o solo un diccionario {user: [items_bought]}
user_item_matrix.to_pickle("../app/services/models/user_item_matrix.pkl")

# 4. Guardar catálogo de productos (StockCode -> Description) para mostrar nombres en la API
product_catalog = df[['StockCode', 'Description']].drop_duplicates('StockCode').set_index('StockCode')
product_catalog.to_pickle("../app/services/models/product_catalog.pkl")

print("Modelos y artefactos guardados exitosamente en ../app/services/models/")
