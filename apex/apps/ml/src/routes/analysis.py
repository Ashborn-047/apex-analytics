"""
FastAPI router definition for F1 analytics and ingestion endpoints powered by LangChain.
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from src.services.langchain_service import langchain_service
# We can pull some real data from our models to pass into the prompt!
from src.models.elo import EloRatingSystem
from src.models.strategy import PitStopStrategy

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analysis",
    tags=["analysis", "langchain"]
)

elo_system = EloRatingSystem()
strategy_engine = PitStopStrategy()

# --- Schemas ---

class IngestionInput(BaseModel):
    """
    Pydantic schema for raw text documents ingestion input.
    """
    documents: List[str] = Field(..., description="A list of raw text documents to ingest into the F1 Knowledge Base.")
    metadatas: Optional[List[Dict[str, Any]]] = Field(None, description="Optional metadata dicts corresponding to each document.")

class ChatQueryInput(BaseModel):
    """
    Pydantic schema for analytical query input to the RAG assistant.
    """
    query: str = Field(..., description="The user's analytical question about F1.")
    include_elo: bool = Field(False, description="Whether to include current Elo data as context.")
    include_strategy: bool = Field(False, description="Whether to include a sample strategy recommendation as context.")
    driver_id_context: Optional[str] = Field(None, description="A specific driver ID (e.g. VER) to gather targeted realtime context for.")

# --- Routes ---

@router.post("/ingest")
def ingest_documents(data: IngestionInput):
    """
    Ingest a list of text documents into the in-memory RAG Vector Store.
    """
    if data.metadatas and len(data.metadatas) != len(data.documents):
        raise HTTPException(status_code=400, detail="Length of metadatas must match length of documents if provided.")

    try:
        chunks_added = langchain_service.ingest_texts(texts=data.documents, metadatas=data.metadatas)
        return {
            "status": "success",
            "message": "Successfully ingested documents into RAG store.",
            "chunks_created": chunks_added
        }
    except Exception as e:
        logger.exception("Failed to ingest documents into vector store")
        raise HTTPException(status_code=500, detail=f"Failed to ingest documents: {str(e)}") from e


@router.post("/chat")
def chat_with_assistant(data: ChatQueryInput):
    """
    Send a query to the LangChain RAG assistant, optionally including real-time
    context from our backend ML models.
    """
    context_data = {}

    try:
        # Optionally inject real-time Elo Data
        if data.include_elo:
            try:
                if data.driver_id_context:
                    rating = elo_system.get_driver_rating(data.driver_id_context)
                    context_data["Elo"] = {data.driver_id_context: rating}
                else:
                    # Provide top 5 rankings as general context
                    rankings = elo_system.get_rankings()
                    context_data["Top 5 Elo Rankings"] = rankings[:5]
            except Exception as e:
                logger.warning(f"Failed to inject Elo context for driver {data.driver_id_context}: {e!r}")

        # Optionally inject some Strategy Data
        if data.include_strategy and data.driver_id_context:
            try:
                # NOTE: Using placeholder parameters for strategy window recommendations 
                # because live telemetry is not active.
                rec = strategy_engine.recommend_pit_window(
                    current_lap=20,
                    total_laps=58,
                    current_compound="MEDIUM",
                    stint_laps=20,
                    gap_ahead=1.5,
                    gap_behind=3.0,
                    circuit_id="monza",
                    position=1
                )
                context_data["Sample Live Strategy Recommendation"] = rec
            except Exception as e:
                logger.warning(f"Failed to inject live strategy recommendation context for driver {data.driver_id_context}: {e!r}")

        # Call LangChain
        response = langchain_service.analyze_query(query=data.query, context_data=context_data)

        return {
            "status": "success",
            "query": data.query,
            "response": response,
            "context_injected": list(context_data.keys())
        }
    except Exception as e:
        logger.exception("Assistant chat failed to process query")
        raise HTTPException(status_code=500, detail=f"Assistant chat failed: {str(e)}") from e

