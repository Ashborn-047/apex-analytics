from fastapi import FastAPI
import os

app = FastAPI(
    title="APEX - ML Prediction Service",
    description="Python microservice for F1 analytics, Elo ratings, and strategy predictions.",
    version="1.0.0"
)

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
