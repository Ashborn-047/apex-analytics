import os
import sys
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = BASE_DIR / "data" / "documents"
SEASON_LOG_FILE = DOCS_DIR / "2026_season_log.md"

def append_race_report(report_markdown: str):
    """
    Appends the LLM-generated markdown report to the 2026 season log file.
    If the file doesn't exist, it creates it with a header.
    After appending, it triggers the document ingestion script to re-index the RAG system.
    """
    os.makedirs(DOCS_DIR, exist_ok=True)
    
    file_exists = SEASON_LOG_FILE.exists()
    
    with open(SEASON_LOG_FILE, "a", encoding="utf-8") as f:
        if not file_exists:
            f.write("# 2026 F1 Season Log — RAG Knowledge Document\n")
            f.write("# Coverage: 2026 Season | Live Updates\n")
            f.write("# Format: Narrative (md) + Stat Blocks (json)\n")
            f.write("# Purpose: APEX RAG retrieval — aggregating race reports as the season progresses\n\n")
            f.write("---\n\n")
            
        f.write(report_markdown)
        f.write("\n\n---\n\n")
        
    print(f"Successfully appended race report to {SEASON_LOG_FILE}")
    
    # Trigger re-ingestion
    try:
        print("Triggering document ingestion to update Graphify and pgvector...")
        from src.services.document_ingestion import sync_document_library
        sync_document_library()
        print("Document ingestion completed successfully.")
    except Exception as e:
        print(f"Error during document ingestion: {e}")
        raise e
