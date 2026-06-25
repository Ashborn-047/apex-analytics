from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from src.routes.prediction import router as prediction_router
from src.routes.analysis import router as analysis_router

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
app.include_router(prediction_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    import threading
    from src.services.document_ingestion import sync_document_library
    # Run sync in background to not block startup
    threading.Thread(target=sync_document_library, daemon=True).start()


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
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)
