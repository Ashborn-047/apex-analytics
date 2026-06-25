import os
import glob
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_core.documents import Document
from src.services.langchain_service import langchain_service

def sync_document_library(docs_dir: str = None) -> int:
    """
    Scans the document library directory, chunks all markdown files using 
    semantic markdown headers, and ingests them into the RAG vector store.
    """
    if docs_dir is None:
        # Default to data/documents relative to the ml app root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        docs_dir = os.path.join(base_dir, "data", "documents")

    if not os.path.exists(docs_dir):
        print(f"Document directory {docs_dir} does not exist.")
        return 0

    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on, strip_headers=False)

    all_docs = []
    
    # Process Markdown files
    md_files = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)
    for filepath in md_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Split by markdown headers to keep semantic sections together
            docs = markdown_splitter.split_text(content)
            
            # Inject metadata
            filename = os.path.basename(filepath)
            for doc in docs:
                doc.metadata["source"] = filename
                doc.metadata["filepath"] = filepath
                all_docs.append(doc)
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

    # Process TXT files
    txt_files = glob.glob(os.path.join(docs_dir, "**/*.txt"), recursive=True)
    for filepath in txt_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            filename = os.path.basename(filepath)
            doc = Document(page_content=content, metadata={"source": filename, "filepath": filepath})
            all_docs.append(doc)
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

    if not all_docs:
        print("No documents found to ingest.")
        return 0

    # Ingest the parsed documents into the langchain_service
    # It will further chunk them with RecursiveCharacterTextSplitter if they are too large
    chunks_added = langchain_service.ingest_documents(all_docs)
    print(f"Ingested {len(all_docs)} parsed sections into {chunks_added} chunks in vector store.")
    return chunks_added
