"""
Service layer implementation for RAG (Retrieval-Augmented Generation) using LangChain, pgvector, and local HuggingFace embeddings.
"""

import os
import json
import httpx
from typing import List, Dict, Any, Optional

from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase

# Initialize SQLDatabase if DATABASE_URL is set
db_instance = None
db_url = os.getenv("DATABASE_URL")
if db_url:
    try:
        db_instance = SQLDatabase.from_uri(db_url)
        print("SQLDatabase helper initialized successfully.")
    except Exception as e:
        print(f"WARNING: Failed to connect SQLDatabase: {e}")

# ============================================================================
# AGENT TOOLS
# ============================================================================

@tool
def query_f1_database(sql_query: str) -> str:
    """
    Executes a read-only SQL SELECT query against the F1 historical database to fetch structured telemetry, results, and records.
    Use this tool to answer quantitative questions, such as listing lap times, driver information, circuit details, pit stop durations, constructor standings, or race results.
    
    The database schema includes the following tables and fields:
    - circuits (id, name, location, country, first_gp, length_km, corners)
    - seasons (year, rounds)
    - races (id, season, round, circuit_id, date, name)
    - drivers (id, code, name, dob, nationality)
    - constructors (id, name, nationality)
    - results (race_id, driver_id, constructor_id, grid, position, points, status, fastest_lap)
    - lap_times (race_id, driver_id, lap, time_ms, position)
    - qualifying (race_id, driver_id, constructor_id, q1_ms, q2_ms, q3_ms, position)
    - pit_stops (race_id, driver_id, lap, stop_number, duration_ms)
    
    Ensure that the input is a valid SQL SELECT query. Do not execute any write, update, or schema alteration queries.
    """
    if not db_instance:
        return "Database connection is not available."
    try:
        # Run the query using SQLDatabase utility
        return db_instance.run(sql_query)
    except Exception as e:
        return f"Error executing database query: {str(e)}"

@tool
def retrieve_f1_documents(query: str) -> str:
    """
    Searches the pgvector knowledge base for F1 regulations, track specifications, and historical summaries.
    Use this tool to find unstructured textual documents.
    """
    if not langchain_service or not langchain_service.vector_store:
        return "Vector store not initialized."
    docs = langchain_service.vector_store.similarity_search(query, k=3)
    return "\n\n".join(
        f"Source: {d.metadata.get('source', 'unknown')}\nContent: {d.page_content}"
        for d in docs
    )

@tool
def query_apex_api(endpoint: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Queries the APEX API REST endpoints to retrieve structured F1 data.
    Use this tool for structured database lookups like getting a list of races, drivers, circuits, or constructors.
    
    Args:
        endpoint: The endpoint path (e.g. 'drivers', 'races/2026', 'circuits', 'constructors', 'seasons').
        params: Optional dictionary of query parameters.
    """
    apex_api_url = os.getenv("APEX_API_URL", "http://localhost:3000")
    url = f"{apex_api_url}/api/{endpoint.lstrip('/')}"
    try:
        resp = httpx.get(url, params=params, timeout=5.0)
        resp.raise_for_status()
        return json.dumps(resp.json())
    except Exception as e:
        return f"Error querying APEX API: {str(e)}"

@tool
def call_ml_prediction(endpoint: str, payload: Optional[str] = None) -> str:
    """
    Calls APEX ML prediction endpoints for live model predictions.
    Use this tool for Elo ratings, pit strategy window recommendations, lap time predictions, weather impact, DNF risks, and qualifying outcomes.
    
    Args:
        endpoint: The prediction endpoint name (e.g. 'elo/rankings', 'strategy', 'lap-time', 'weather-impact', 'dnf-risk/VER', 'qualifying').
        payload: A JSON string representing the payload/query parameters for the request (or None).
    """
    ml_base_url = os.getenv("ML_BASE_URL", "http://localhost:8000")
    path = endpoint.lstrip('/')
    if not path.startswith('predict/'):
        path = f"predict/{path}"

    url = f"{ml_base_url}/api/{path}"
    try:
        data = None
        if payload:
            try:
                data = json.loads(payload)
            except Exception:
                pass

        is_get = not data or any(x in path for x in ["/rankings", "/head-to-head", "/actuals", "dnf-risk/"])

        if is_get:
            resp = httpx.get(url, params=data, timeout=5.0)
        else:
            resp = httpx.post(url, json=data, timeout=5.0)

        resp.raise_for_status()
        return json.dumps(resp.json())
    except Exception as e:
        return f"Error calling ML prediction endpoint: {str(e)}"


# ============================================================================
# LANGCHAIN SERVICE
# ============================================================================

class LangChainService:
    """
    LangChainService handles document chunking, ingestion, persistent vector storage via Neon pgvector,
    and routing analytical queries using a modern agent graph equipped with vector, SQL API, and prediction tools.
    """
    def __init__(self):
        """
        Initializes the service by setting up LLM connection details, initializing pgvector connection,
        defining agent tools, and creating the agent graph.
        """
        self._init_vector_store()
        self._init_tools()
        self._init_agent_graph()

    def _init_vector_store(self):
        # 1. Setup Embeddings and Splitter
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        # 2. Setup pgvector Database Connection
        db_url = os.getenv("DATABASE_URL")
        self.vector_store = None
        self.engine = None

        if db_url:
            try:
                # Ensure connection uses psycopg3 driver for langchain-postgres
                connection_url = db_url
                if connection_url.startswith("postgresql://"):
                    connection_url = connection_url.replace("postgresql://", "postgresql+psycopg://", 1)

                from langchain_postgres import PGEngine, PGVectorStore

                self.engine = PGEngine.from_connection_string(url=connection_url)
                TABLE_NAME = "apex_f1_knowledge"
                VECTOR_SIZE = 384

                # Auto-initialize the table and vector size
                self.engine.init_vectorstore_table(
                    table_name=TABLE_NAME,
                    vector_size=VECTOR_SIZE
                )

                # Create sync vector store
                self.vector_store = PGVectorStore.create_sync(
                    engine=self.engine,
                    table_name=TABLE_NAME,
                    embedding_service=self.embeddings
                )
                print("Successfully initialized persistent pgvector store on Neon.")
            except Exception as e:
                print(f"WARNING: Failed to connect to pgvector store: {e}. Falling back to in-memory vector store.")

        if not self.vector_store:
            # Fallback to in-memory vector store for development safety
            from langchain_core.vectorstores import InMemoryVectorStore
            self.vector_store = InMemoryVectorStore(embedding=self.embeddings)
            self.vector_store.add_documents([
                Document(page_content="APEX F1 Knowledge Base initialized.", metadata={"source": "system"})
            ])
            print("Successfully initialized fallback in-memory vector store.")

    def _init_tools(self):
        self.tools = [retrieve_f1_documents, query_apex_api, call_ml_prediction, query_f1_database]

    def _init_agent_graph(self):
        # Determine LLM configuration (pointing to Nvidia Nemotron or Groq Llama)
        nvidia_key = os.getenv("NVIDIA_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if nvidia_key:
            api_key = nvidia_key
            base_url = os.getenv("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1")
            model_name = os.getenv("NVIDIA_MODEL", "nvidia/llama-3-nemotron-70b-instruct")
        else:
            api_key = openai_key
            base_url = os.getenv("OPENAI_API_BASE", "https://api.groq.com/openai/v1")
            model_name = os.getenv("LLM_MODEL", "llama3-8b-8192")

        # Construct System Prompt with Glossary
        system_prompt_str = """You are an elite F1 Race Strategy and Analytics Assistant for the APEX system.
Your role is to combine historical telemetry, track specifications, and active predictions to provide data-driven strategic advice.

F1 GLOSSARY (always apply these definitions):
- "box" -> pit stop (enter the pit lane)
- "undercut" -> pit early to gain track position on fresher tyres
- "overcut" -> stay out longer, gain position while rivals pit
- "tyre cliff" -> exponential performance degradation at end of tyre life
- "DRS train" -> line of cars where rear car gains DRS but cannot overtake
- "VSC" -> Virtual Safety Car (all cars hold delta time, no overtaking)
- "thermal graining" -> surface tyre damage from excessive heat early in a stint
"""

        # Initialize LLM and Agent Graph
        if api_key:
            self.llm = ChatOpenAI(
                model=model_name,
                api_key=api_key,
                base_url=base_url,
                temperature=0.2,
                max_tokens=1024
            )
            self.agent_executor = create_agent(
                model=self.llm,
                tools=self.tools,
                system_prompt=system_prompt_str
            )
            print(f"LLM and agent graph initialized successfully with model {model_name}.")
        else:
            self.llm = None
            self.agent_executor = None
            print("WARNING: Neither NVIDIA_API_KEY nor OPENAI_API_KEY is set. LLM features will not work until it is provided.")

    def ingest_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> int:
        """
        Ingests a list of raw text strings into the RAG vector store.

        :param texts: A list of documents content strings.
        :param metadatas: Optional list of dict metadata matching each document.
        :return: Number of split chunks added to the vector store.
        """
        if metadatas and len(metadatas) != len(texts):
            raise ValueError("Length of metadatas must match length of texts")

        docs = []
        for i, text in enumerate(texts):
            meta = metadatas[i] if metadatas else {}
            docs.append(Document(page_content=text, metadata=meta))

        split_docs = self.text_splitter.split_documents(docs)
        if split_docs and self.vector_store:
            self.vector_store.add_documents(split_docs)
        return len(split_docs)

    def analyze_query(self, query: str, context_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Answers a user query using the agentic router which has access to vector search,
        structured APEX API data, and prediction models.

        :param query: Analytical user query about F1.
        :param context_data: Optional dictionary of real-time telemetry/Elo/Strategy context.
        :return: LLM generated textual answer.
        """
        if not self.llm or not self.agent_executor:
            return "Error: LLM not initialized. Please set OPENAI_API_KEY or NVIDIA_API_KEY environment variable."

        # If context_data is provided, inject it directly into the initial user query
        full_query = query
        if context_data:
            context_str = json.dumps(context_data, indent=2)
            full_query = f"Real-time Context from APEX:\n{context_str}\n\nUser Question: {query}"

        try:
            result = self.agent_executor.invoke({"messages": [{"role": "user", "content": full_query}]})
            last_message = result["messages"][-1]
            if hasattr(last_message, "content"):
                return last_message.content
            elif isinstance(last_message, dict) and "content" in last_message:
                return last_message["content"]
            else:
                return str(last_message)
        except Exception as e:
            return f"Failed to generate analysis: {str(e)}"

langchain_service = LangChainService()
