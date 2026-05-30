from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from src.routes.prediction import router as prediction_router

app = FastAPI(
    title="APEX - ML Prediction Service",
    description="Python microservice for F1 analytics, Elo ratings, and strategy predictions.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(prediction_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "apex-ml",
        "environment": os.getenv("ENV", "development")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
