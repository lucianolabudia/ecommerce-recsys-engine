
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as recommendation_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="RecSys Engine APIs — Motor de Recomendaciones",
    description="""## 🛒 E-Commerce Recommendation System Engine
This API provides personalized product recommendations using Collaborative Filtering and Association Rules.

### 🚀 Servicios / Services:
* **User Recommendations**: Personalized suggestions based on user behavior.
* **Association Rules**: Market Basket Analysis (items frequently bought together).
* **Dashboard Data**: Stats and analytics for the frontend.

---

## 📦 Motor de Recomendaciones para E-Commerce
Esta API proporciona recomendaciones personalizadas de productos utilizando Filtro Colaborativo y Reglas de Asociación.

### 🛠️ Funcionalidades:
* **Recomendaciones de Usuario**: Sugerencias personalizadas basadas en el comportamiento del usuario.
* **Reglas de Asociación**: Análisis de canasta (productos que se compran juntos frecuentemente).
* **Datos del Dashboard**: Estadísticas y analíticas para el frontend.""",
    version="1.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendation_router, prefix="/recommend", tags=["recommendations"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Recommender Engine is running"}
