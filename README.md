# Product Recommendation System

Un sistema de recomendación inteligente para E-commerce, desarrollado con Python, Machine Learning y FastAPI.

## Descripción del Proyecto

Este proyecto implementa dos enfoques complementarios de recomendación de productos para aumentar el ticket promedio y mejorar la experiencia del usuario final:

1.  **Filtro Colaborativo (SVD)**: Sugiere productos basándose en las preferencias similares entre usuarios ("A los usuarios como tú les gustó esto").
2.  **Reglas de Asociación (Apriori)**: Identifica patrones de compra frecuentes ("Comprados juntos habitualmente") para sugerencias de venta cruzada en el carrito.

## Contexto y Objetivo

Utilizando el dataset **Online Retail** (UCI ML Repository), el objetivo es predecir qué productos serían de interés para un cliente específico basándose en su historial de transacciones.

## Dataset

- **Fuente**: [Online Retail Data Set (Kaggle)](https://www.kaggle.com/datasets/tunguz/online-retail)
- **Contenido**: Transacciones de un retail online basado en UK, entre 01/12/2010 y 09/12/2011.

## Tecnologías Utilizadas

- **Lenguaje**: Python 3.10+
- **Web Framework**: FastAPI (Backend API)
- **Data Science & ML**:
  - `pandas`, `numpy`: Manipulación y limpieza de datos.
  - `scikit-learn`: Modelado (SVD/TruncatedSVD) y métricas.
  - `mlxtend`: Algoritmo Apriori para Reglas de Asociación.
- **Visualización**: `matplotlib`, `seaborn` (EDA).
- **Servidor**: Uvicorn.

## Estructura del Proyecto

```
ecommerce-recsys-engine/
├── app/
│   ├── api/            # Endpoints de la API (Rutas)
│   ├── core/           # Configuración (Logging, Settings)
│   ├── models/         # Modelos de datos (Pydantic Schemas)
│   └── services/       # Lógica de negocio y algoritmos de ML
├── data/               # Almacenamiento local del dataset (ignorado por Git)
├── notebooks/          # Jupyter Notebooks para EDA y Prototipado
├── requirements.txt    # Dependencias del proyecto
└── README.md           # Documentación del proyecto
```

## Instalación y Configuración

1.  **Clonar el repositorio**:

    ```bash
    git clone https://github.com/tu-usuario/ecommerce-recsys-engine.git
    cd ecommerce-recsys-engine
    ```

2.  **Crear entorno virtual**:

    ```bash
    python -m venv .venv
    # Windows:
    .\.venv\Scripts\Activate.ps1
    # Linux/Mac:
    source .venv/bin/activate
    ```

3.  **Instalar dependencias**:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Descargar Datos**:
    Descarga `Online Retail.xlsx` desde Kaggle y colócalo en la carpeta `data/`.

## Uso (Próximamente)

### Ejecutar API

```bash
uvicorn app.main:app --reload
```

La documentación interactiva estará disponible en `http://localhost:8000/docs`.

### Ejecutar Notebooks

```bash
jupyter notebook
```

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios mayores.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)
