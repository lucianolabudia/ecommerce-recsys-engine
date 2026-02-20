# Plan de Implementación: Sistema de Recomendación de Productos

Este plan detalla los pasos para construir un sistema de recomendación utilizando el dataset "Online Retail". El proyecto seguirá las mejores prácticas de desarrollo con Python, FastAPI y Machine Learning No Supervisado.

## Fase 1: Configuración del Entorno y Estructura del Proyecto

1.  **Inicialización del Repositorio**: Configurar Git y `.gitignore`.
2.  **Entorno Virtual**: Crear y activar un entorno virtual de Python.
3.  **Gestión de Dependencias**: Crear `requirements.txt` con las librerías necesarias:
    - `fastapi`, `uvicorn` (Backend API).
    - `pandas`, `numpy` (Manipulación de Datos).
    - `scikit-learn`, `scikit-surprise` (Modelado - SVD).
    - `mlxtend` (Reglas de Asociación - Apriori).
    - `matplotlib`, `seaborn` (Visualización - EDA).
    - `pydantic` (Validación de Datos).
4.  **Estructura de Directorios**: Organizar el código siguiendo el patrón _FastAPI Expert_:
    - `app/`: Código fuente principal.
    - `app/api/`: Definición de rutas (endpoints).
    - `app/core/`: Configuración y utilidades.
    - `app/services/`: Lógica de negocio (Modelos de ML).
    - `app/models/`: Schemas Pydantic.
    - `data/`: Almacenamiento del dataset (local).
    - `notebooks/`: Análisis exploratorio y prototipado.

## Fase 2: Adquisición y Preparación de Datos

1.  **Ingesta de Datos**:
    - Utilizar la librería `kagglehub` para cargar el dataset "Online Retail" directamente desde Kaggle sin necesidad de descarga manual de archivos.
    - Cargar el dataset en un DataFrame de Pandas usando `KaggleDatasetAdapter`.
2.  **Limpieza de Datos**:
    - **Manejo de Nulos**: Eliminar registros con `CustomerID` nulo, ya que necesitamos identificar usuarios para el filtro colaborativo.
    - **Transacciones Canceladas**: Filtrar facturas (`InvoiceNo`) que comiencen con 'C'.
    - **Tipos de Datos**: Convertir `InvoiceDate` a formato datetime.
    - **Validación**: Asegurar que `Quantity` y `UnitPrice` sean positivos.

## Fase 3: Análisis Exploratorio de Datos (EDA)

1.  **Identificación de Best Sellers**:
    - Calcular los productos más vendidos por cantidad y por frecuencia de aparición en facturas.
    - Visualizar el Top 10/20 productos.
2.  **Análisis de Comportamiento de Usuario**:
    - Distribución de compras por usuario (cuántas compras realiza el usuario promedio).
    - Distribución del ticket promedio.
3.  **Análisis Temporal**:
    - Ventas por mes/día de la semana (opcional, para contexto).

## Fase 4: Modelado - Enfoque 1: Reglas de Asociación (Apriori)

1.  **Preparación de la Cesta (Market Basket Analysis)**:
    - Transformar los datos transaccionales a formato "one-hot encoded" (matriz binaria Transacción x Producto).
    - Agrupar por `InvoiceNo` y `Description` (o `StockCode`).
2.  **Algoritmo Apriori**:
    - Aplicar Apriori para encontrar conjuntos de ítems frecuentes (itemsets) con un soporte mínimo definido.
3.  **Generación de Reglas**:
    - Generar reglas de asociación filtrando por una confianza o lift mínimo.
    - Interpretar reglas: "Si compra A, entonces es probable que compre B".

## Fase 5: Modelado - Enfoque 2: Filtro Colaborativo (SVD)

1.  **Matriz Usuario-Ítem**:
    - Crear una matriz donde las filas son usuarios y las columnas productos.
    - Definir la métrica de interacción: Frecuencia de compra o Cantidad total comprada (como rating implícito).
2.  **Entrenamiento del Modelo**:
    - Utilizar la librería `Surprise` con el algoritmo SVD (Singular Value Decomposition).
    - Dividir datos en entrenamiento y prueba (Cross-Validation) para evaluar el error (RMSE/MAE).
3.  **Generación de Predicciones**:
    - Predecir la "puntuación" para ítems no comprados por un usuario.
    - Seleccionar los Top N ítems con mayor predicción.

## Fase 6: Despliegue (Deployment) con FastAPI

1.  **API Design**:
    - Endpoint `POST /train`: (Opcional) Reentrenar modelos con nuevos datos.
    - Endpoint `GET /recommend/user/{user_id}`: Devuelve recomendaciones basadas en Filtro Colaborativo (SVD).
    - Endpoint `POST /recommend/association`: Recibe una lista de productos en el carrito y devuelve sugerencias basadas en Reglas de Asociación.
2.  **Implementación**:
    - Crear los routers y servicios correspondientes.
    - Utilizar Pydantic para validar entradas y salidas.
    - Persistir los modelos entrenados (pickle/joblib) para no reentrenar en cada petición.

## Fase 7: Validación y Entrega ✅

1.  **Pruebas Manuales**: Ejecutadas con `scripts/validate_system.py`. Todos los endpoints funcionan correctamente.
2.  **Documentación**: README completado con instrucciones para Backend, Frontend y Traducciones.
3.  **Demo**: Sistema completamente funcional con Dashboard en `localhost:5173` y API en `localhost:8000`.
