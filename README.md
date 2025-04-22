# Semantic Document Search with ModernBERT and Milvus

## Overview

This repository contains a full-stack application designed for efficient semantic search across a collection of documents, specifically demonstrated with machine learning research papers from ArXiv. It allows users to find documents based on conceptual similarity and contextual relevance, going beyond simple keyword matching.

**What problem does it solve?**
Traditional keyword search often fails to capture the user's intent or find documents related by meaning. This project addresses that by implementing semantic search, leveraging vector embeddings and a specialized database.

**What technologies does it use?**
-   **Embedding Model:** `nomic-ai/modernbert-embed-base` (via `sentence-transformers`) for generating meaningful vector representations (embeddings) of documents and queries. Configuration is managed via `backend/.env`.
-   **Vector Database:** Milvus for storing, indexing, and efficiently searching high-dimensional document embeddings. Configuration (URI) is managed via `backend/.env`.
-   **Backend:** FastAPI (Python) to handle API requests, interact with Milvus, and serve search results. Includes explicit collection loading on startup and improved error handling.
-   **Frontend:** Vite + React (TypeScript) with Ant Design for a user-friendly interface. Features loading indicators, debounced suggestions, and displays abstracts. API endpoint configured via `frontend/.env`.
-   **Suggestions:** `rapidfuzz` for providing type-ahead query suggestions based on titles indexed during data ingestion (`backend/indexed_titles.txt`).
-   **Containerization:** Docker to run the Milvus vector database instance easily.
-   **Configuration:** `python-dotenv` (backend) and Vite env variables (frontend) for managing settings.

## Why This Approach?

-   **Semantic Understanding:** Goes beyond keywords to understand the *meaning* behind queries and documents, leading to more relevant results.
-   **ModernBERT:** Chosen for its balance of performance and efficiency. It generates high-quality, context-aware embeddings suitable for semantic tasks while being computationally less demanding than some larger models.
-   **Milvus:** A purpose-built vector database optimized for storing and querying billions of high-dimensional vectors with low latency, making it ideal for scalable semantic search applications.
-   **FastAPI & React/Vite:** Modern, performant frameworks for building the backend API and frontend UI.

## How It Works (Working Logic)

The application operates in two main phases: Data Ingestion and Querying.

1.  **Data Ingestion (`backend/ingest_data.py`):**
    *   **Configuration:** Reads Milvus URI, collection name, and embedding model name from `backend/.env`.
    *   **Load Data:** Fetches documents (demonstrated with `CShorten/ML-ArXiv-Papers`).
    *   **Generate Embeddings:** Uses the configured ModernBERT model to convert document text (title + abstract) into vector embeddings (768 dimensions). This process is batched for efficiency.
    *   **Connect to Milvus:** Establishes a connection using the configured URI.
    *   **Create Collection:** Defines and creates the configured collection in Milvus with a schema including fields for `id` (auto-generated primary key), `title`, `abstract`, the combined `text`, and the `dense_vector`. An `AUTOINDEX` optimized for `COSINE` similarity is applied to the vector field. Existing collections with the same name are dropped first.
    *   **Insert Data:** Inserts document metadata (`title`, `abstract`, `text`) and embeddings into Milvus. This is done **without loading the entire dataset into memory at once**, processing directly from the Hugging Face dataset batches for better memory efficiency.
    *   **Flush & Load:** Ensures data is persisted (`flush`) and loaded into memory (`load_collection`) within Milvus.
    *   **Generate Suggestion File:** Extracts all document titles and saves them to `backend/indexed_titles.txt` for use in frontend suggestions.
    *   *Note: This script needs to be run only once initially or whenever the source data changes.*

2.  **Querying (Backend + Frontend Interaction):**
    *   **Backend Startup:** Reads configuration from `.env`. Uses FastAPI's `lifespan` manager to explicitly load the configured Milvus collection into memory, ensuring readiness for queries. Loads suggestion titles from `indexed_titles.txt`.
    *   **User Query (Frontend):** The user types a query into the search bar (`http://localhost:5173`). The frontend reads the backend API URL from `frontend/.env`.
    *   **Suggestions (Frontend -> Backend):** As the user types, the frontend sends partial queries (debounced to limit frequency) to the `/suggestions` endpoint. The backend uses `rapidfuzz` to find similar titles from the loaded `indexed_titles.txt` and returns suggestions. A loading indicator is shown in the search bar during the fetch. Errors are handled gracefully.
    *   **Search Request (Frontend -> Backend):** When the user submits a full query, the frontend sends it to the `/search` endpoint. A loading indicator is shown over the results area.
    *   **Query Embedding (Backend):** The backend receives the query, prepends `search_query:`, and uses the ModernBERT model to generate the query embedding.
    *   **Milvus Search (Backend):** The backend searches the configured Milvus collection for the `k` most similar document embeddings (cosine similarity), requesting the `title` and `abstract` fields. Milvus exceptions are caught, and appropriate HTTP errors (503) are returned. Other unexpected errors return a 500 status.
    *   **Process Results (Backend):** The backend extracts the `title`, `abstract`, and `score` for each matching document.
    *   **Display Results (Frontend):** The backend sends the results back. The frontend displays them in a list, showing the title, relevance score, and the abstract (with an expandable ellipsis). Search errors are displayed to the user via Ant Design messages.


## Features & Improvements

-   Semantic search for documents based on meaning.
-   Fast and scalable search powered by Milvus.
-   High-quality embeddings generated by ModernBERT.
-   User-friendly web interface built with React, Vite, and Ant Design.
-   **Improved Suggestions:** Type-ahead query suggestions based on actual indexed document titles.
-   **Enhanced Results:** Search results now include paper abstracts, displayed with an expandable view.
-   **Improved UX:** Loading indicators provide visual feedback during search and suggestion fetching. Debounced suggestion input reduces unnecessary API calls. User-friendly error messages are displayed for search failures.
-   **Robust Backend:** Explicit Milvus collection loading on startup. Improved error handling with specific HTTP status codes for Milvus or server issues.
-   **Optimized Ingestion:** Data ingestion script (`ingest_data.py`) is more memory-efficient, processing data in batches.
-   **Configuration Management:** Backend and frontend settings (Milvus URI, API URL, model names, etc.) are managed via `.env` files.
-   **Clean Git History:** Updated `.gitignore` files (root, backend, frontend) to exclude generated files, caches, dependencies, and environment files.
-   Easy setup using Docker for the vector database.

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── .env              # Backend Environment Variables (GITIGNORED)
│   ├── .gitignore        # Backend Git Ignore Rules
│   ├── venv/             # Python virtual environment (GITIGNORED)
│   ├── model_cache/      # Cached SentenceTransformer model (GITIGNORED)
│   ├── indexed_titles.txt # Generated titles for suggestions (GITIGNORED)
│   ├── __init__.py
│   ├── all_queries.txt   # Original sample queries (can be removed)
│   ├── ingest_data.py    # Script to process data and load into Milvus
│   ├── main.py           # FastAPI application code
│   ├── query_engline.py  # Milvus client initialization
│   └── requirements.txt  # Backend Python dependencies
├── frontend/             # Vite/React frontend
│   ├── .env              # Frontend Environment Variables (GITIGNORED)
│   ├── .gitignore        # Frontend Git Ignore Rules
│   ├── node_modules/     # Node.js dependencies (GITIGNORED)
│   ├── dist/             # Build output (GITIGNORED)
│   ├── public/
│   ├── src/              # Frontend source code
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md         # Frontend specific README (if any)
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── volumes/              # Docker volume for Milvus data persistence (GITIGNORED)
│   └── milvus/
├── .gitignore            # Root Git Ignore Rules
├── IMPROVEMENT_PLAN.md   # Development improvement plan (optional)
├── README.md             # This file
├── standalone_embed.sh   # Original Milvus setup script (optional)
├── system_design.png     # Architecture diagram image
├── embedEtcd.yaml        # Milvus configuration file (GITIGNORED)
└── user.yaml             # Milvus configuration file (GITIGNORED)
```

## Prerequisites

Ensure you have the following installed:

-   **Python:** 3.10+ (check with `python --version`)
-   **Node.js:** 16+ (check with `node --version`)
-   **Docker:** Latest version recommended (check with `docker --version`). Ensure the Docker daemon is running.

## Getting Started (Setup and Running)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/raoofaltaher/modernbert-semantic-search.git # Replace with actual URL
    cd modernbert-semantic-search
    ```

2.  **Start Milvus:**
    Run the following command in your terminal from the project root directory. This command starts Milvus in a Docker container. *Ensure the absolute paths in the `-v` arguments match your project location.*
    ```bash
    # Make sure Docker Desktop is running!
    # Replace 'PATH' below if your project path is different
    docker run -d --name milvus-standalone --security-opt seccomp:unconfined -e ETCD_USE_EMBED=true -e ETCD_DATA_DIR=/var/lib/milvus/etcd -e ETCD_CONFIG_PATH=/milvus/configs/embedEtcd.yaml -e COMMON_STORAGETYPE=local -v 'PATH'/modernbert-semantic-search//volumes/milvus:/var/lib/milvus -v 'PATH'/modernbert-semantic-search/embedEtcd.yaml:/milvus/configs/embedEtcd.yaml -v 'PATH'/modernbert-semantic-search/user.yaml:/milvus/configs/user.yaml -p 19530:19530 -p 9091:9091 -p 2379:2379 --health-cmd="curl -f http://localhost:9091/healthz" --health-interval=30s --health-start-period=90s --health-timeout=20s --health-retries=3 milvusdb/milvus:v2.5.10 milvus run standalone
    ```
    You can check if the container is running with `docker ps`.

3.  **Backend Setup:**
    *   Navigate to the backend directory: `cd backend`
    *   Create `.env` file (if it doesn't exist) and configure variables (see `backend/.env.example` or Step 1.2 in the improvement plan). *Ensure `MILVUS_URI` matches the running Milvus instance.*
    *   Create a Python virtual environment: `python -m venv venv`
    *   Activate the virtual environment (e.g., `.\venv\Scripts\Activate.ps1` on PowerShell).
    *   Install dependencies: `pip install -r requirements.txt`
    *   **Run Data Ingestion (IMPORTANT: Run Once):** `python ingest_data.py` (Wait for completion).
    *   Start the FastAPI server: `uvicorn main:app --host 0.0.0.0 --port 8050 --reload` (API at `http://localhost:8050`).

4.  **Frontend Setup:**
    *   Open a **new terminal**.
    *   Navigate to the frontend directory: `cd frontend`
    *   Create `.env` file (if it doesn't exist) and configure `VITE_API_BASE_URL=http://localhost:8050`.
    *   Install dependencies: `npm install`
    *   Start the Vite development server: `npm run dev` (Check terminal for URL, likely `http://localhost:5173`).

5.  **Access the Application:**
    Open your web browser to the frontend URL (e.g., `http://localhost:5173`).

## License

This project is licensed under the MIT License.

## Acknowledgments

-   **Mehdi Allahyari** and **twosetai** for the original fullstack project and sharing the knowledge: [GitHub](https://github.com/mallahyari/modernbert-semantic-search) , [GitHub](https://github.com/mallahyari/twosetai)
-   **ModernBERT** for semantic embeddings: [Hugging Face ModernBERT Blog](https://huggingface.co/blog/modernbert)
-   **Milvus** for vector database: [Milvus Documentation](https://milvus.io/docs)
-   **Sentence Transformers:** [sbert.net](https://www.sbert.net/)
-   **FastAPI:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
-   **React + Vite:** [react.dev](https://react.dev/), [vitejs.dev](https://vitejs.dev/)