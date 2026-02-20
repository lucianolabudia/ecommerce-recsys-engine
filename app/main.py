
from fastapi import FastAPI
from app.api.endpoints import router as recommendation_router

app = FastAPI(title="Ecommerce Recommender Engine APIs", version="1.0")

app.include_router(recommendation_router, prefix="/recommend", tags=["recommendations"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Recommender Engine is running"}
