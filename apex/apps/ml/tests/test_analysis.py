import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Set some dummy env vars before importing main so that LangChain initializes gracefully
import os
os.environ["OPENAI_API_KEY"] = "dummy_key"
os.environ["OPENAI_API_BASE"] = "http://dummy.url"

from src.main import app

client = TestClient(app)

def test_ingest_endpoint():
    payload = {
        "documents": ["Max Verstappen drives for Red Bull.", "Lewis Hamilton drives for Mercedes."],
        "metadatas": [{"source": "wiki"}, {"source": "wiki"}]
    }

    # We shouldn't need to mock anything for ingest as FAISS and sentence-transformers run locally
    response = client.post("/api/analysis/ingest", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "chunks_created" in data
    assert data["chunks_created"] >= 2

@patch("src.services.document_ingestion.sync_document_library")
def test_sync_documents_endpoint(mock_sync):
    mock_sync.return_value = 10
    
    response = client.post("/api/analysis/sync-documents")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["chunks_created"] == 10
    mock_sync.assert_called_once()

@patch("src.services.langchain_service.LangChainService.analyze_query")
def test_chat_endpoint_no_context(mock_analyze):
    mock_analyze.return_value = "Mocked LLM analysis response."

    payload = {
        "query": "Who does Max drive for?",
        "include_elo": False,
        "include_strategy": False
    }

    response = client.post("/api/analysis/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["response"] == "Mocked LLM analysis response."
    assert data["query"] == payload["query"]
    assert len(data["context_injected"]) == 0

    # Verify the mock was called correctly without context
    mock_analyze.assert_called_once_with(query=payload["query"], context_data={})

@patch("src.services.langchain_service.LangChainService.analyze_query")
def test_chat_endpoint_with_context(mock_analyze):
    mock_analyze.return_value = "Max Verstappen is doing well according to Elo and Strategy."

    payload = {
        "query": "How is Max doing right now?",
        "include_elo": True,
        "include_strategy": True,
        "driver_id_context": "VER"
    }

    response = client.post("/api/analysis/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Elo" in data["context_injected"]
    assert "Sample Live Strategy Recommendation" in data["context_injected"]

    # Verify the mock was called with context
    args, kwargs = mock_analyze.call_args
    assert "Elo" in kwargs["context_data"]
    assert "VER" in kwargs["context_data"]["Elo"]
    assert "Sample Live Strategy Recommendation" in kwargs["context_data"]

def test_query_f1_database_tool():
    from src.services.langchain_service import query_f1_database
    from unittest.mock import MagicMock
    
    # Mock db_instance and its run method
    mock_db = MagicMock()
    mock_db.run.return_value = "[(1, 'VER', 'Max Verstappen')]"
    
    # Temporarily patch db_instance
    with patch("src.services.langchain_service.db_instance", mock_db):
        res = query_f1_database.invoke("SELECT * FROM drivers WHERE code = 'VER';")
        assert res == "[(1, 'VER', 'Max Verstappen')]"
        mock_db.run.assert_called_once_with("SELECT * FROM drivers WHERE code = 'VER';")

