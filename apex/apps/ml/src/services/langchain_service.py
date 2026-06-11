import os
from typing import List, Dict, Any, Optional

from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# We use HuggingFaceEmbeddings because sentence-transformers runs locally nicely
from langchain_huggingface import HuggingFaceEmbeddings

# Since I see hardware constraints are an issue and we want to use an Open Source Model
# but via a hosted API standard, we can configure an OpenAI client to point to a free OS provider
# (e.g. Groq, Together, vLLM, etc)
from langchain_openai import ChatOpenAI

class LangChainService:
    def __init__(self):
        # We will use ChatOpenAI but it's meant to be configured to an Open Source provider endpoint.
        # This gives us access to better open source models without local hardware limitations.
        base_url = os.getenv("OPENAI_API_BASE", "https://api.groq.com/openai/v1")
        api_key = os.getenv("OPENAI_API_KEY")
        model_name = os.getenv("LLM_MODEL", "llama3-8b-8192") # Default to open source llama3 on Groq

        if api_key:
            self.llm = ChatOpenAI(
                model=model_name,
                api_key=api_key,
                base_url=base_url,
                temperature=0.3,
                max_tokens=512
            )
        else:
            self.llm = None
            print("WARNING: OPENAI_API_KEY is not set. LLM features will not work until it is provided.")

        # Embeddings for RAG setup (runs locally by default using sentence-transformers)
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

        # Initialize an empty FAISS vector store
        dummy_docs = [Document(page_content="APEX F1 Knowledge Base initialized.", metadata={"source": "system"})]
        self.vector_store = FAISS.from_documents(dummy_docs, self.embeddings)
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    def ingest_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> int:
        """
        Ingests a list of raw text strings into the RAG vector store.
        """
        docs = []
        for i, text in enumerate(texts):
            meta = metadatas[i] if metadatas else {}
            docs.append(Document(page_content=text, metadata=meta))

        split_docs = self.text_splitter.split_documents(docs)
        if split_docs:
            self.vector_store.add_documents(split_docs)
        return len(split_docs)

    def analyze_query(self, query: str, context_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Answers a user query using both the RAG vector store AND real-time context data.
        """
        if not self.llm:
            return "Error: LLM not initialized. Please set OPENAI_API_KEY environment variable (pointing to your open source model provider)."

        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

        template = """
        You are an elite F1 Race Strategy and Analytics Assistant for the APEX system.
        Use the following retrieved background information to help answer the user's question.

        {context}

        You have also been provided with the following real-time data from APEX prediction models:
        REAL-TIME DATA: {real_time_data}

        Question: {question}

        Provide a concise, analytical, and data-driven answer based ONLY on the provided context and real-time data.
        Answer:
        """

        prompt = PromptTemplate.from_template(template)

        # Format the context from retrieved docs into a single string
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        # Build an LCEL chain (LangChain Expression Language) instead of deprecated RetrievalQA
        chain = (
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
                "real_time_data": lambda _: str(context_data) if context_data else "None"
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        try:
            return chain.invoke(query)
        except Exception as e:
            return f"Failed to generate analysis: {str(e)}"

langchain_service = LangChainService()
