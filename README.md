# Semantic Document Search with ModernBERT and Milvus

[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/) [![Node.js Version](https://img.shields.io/badge/node.js-16+-green.svg)](https://nodejs.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat)](https://www.docker.com/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat)](https://fastapi.tiangolo.com/) [![React](https://img.shields.io/badge/React-61DAFB?style=flat)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat)](https://vitejs.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat)](https://www.typescriptlang.org/) [![Ant Design](https://img.shields.io/badge/Ant%20Design-0170FE?style=flat)](https://ant.design/)
[![Milvus](https://img.shields.io/badge/Milvus-4FC8E0?style=flat)](https://milvus.io/) [![Sentence Transformers](https://img.shields.io/badge/Sentence%20Transformers-FFD700?style=flat)](https://www.sbert.net/) [![Rapidfuzz](https://img.shields.io/badge/Rapidfuzz-lightgrey?style=flat)](https://github.com/maxbachmann/RapidFuzz)

## Overview

This repository contains a full-stack application designed for efficient **semantic search** across a collection of documents, specifically demonstrated with machine learning research papers from ArXiv. It allows users to find documents based on conceptual similarity and contextual relevance, going beyond simple keyword matching.

**What problem does it solve?**
Traditional keyword search often fails to capture the user's intent or find documents related by meaning. This project addresses that by implementing semantic search, leveraging state-of-the-art vector embeddings and a specialized vector database for fast, relevant retrieval.

**Key Technologies:**
-   **Embedding Model:** `nomic-ai/modernbert-embed-base` (via `sentence-transformers`) for generating meaningful vector representations.
-   **Vector Database:** Milvus for storing, indexing, and efficiently searching high-dimensional embeddings.
-   **Backend:** FastAPI (Python) API with improved error handling and configuration.
-   **Frontend:** Vite + React (TypeScript) with Ant Design, featuring theme customization, loading states, and enhanced UI components.
-   **Suggestions:** `rapidfuzz` for type-ahead suggestions based on indexed document titles.
-   **Containerization:** Docker for running the Milvus instance.
-   **Configuration:** `.env` files for managing backend and frontend settings.

---

## Features & Recent Improvements ✨

*   **Core Functionality:**
    *   **Semantic Search:** Finds documents based on meaning and context, not just keywords.
    *   **High-Quality Embeddings:** Utilizes `nomic-ai/modernbert-embed-base` via `sentence-transformers` for effective document representation.
    *   **Scalable Vector Storage:** Leverages Milvus for efficient storage, indexing (AUTOINDEX, COSINE similarity), and retrieval of vector embeddings.
*   **Backend & Infrastructure:**
    *   **FastAPI Framework:** Robust and modern Python API.
    *   **Dockerized Milvus:** Easy setup and deployment of the vector database using Docker.
    *   **Robust Startup:** Explicit Milvus collection loading on API server startup (`lifespan` manager).
    *   **Optimized Data Ingestion:** Memory-efficient batch processing for embedding generation and insertion (`backend/ingest_data.py`).
    *   **Configuration Management:** Centralized settings via `.env` files (Milvus URI, model name, collection name).
    *   **Improved Error Handling:** Specific HTTP status codes for backend errors (e.g., 503 for Milvus issues).
    *   **Clean Codebase:** Well-structured `.gitignore` files for managing version control.
*   **Frontend & User Experience:**
    *   **Modern UI:** Built with React, Vite, TypeScript, and Ant Design.
    *   **Theme Customization:** Base theme configured with custom primary color and border radius.
    *   **Dark Mode:** Toggle between light and dark themes (persisted in `localStorage`).
    *   **Enhanced Results:** Displays document titles and expandable abstracts.
    *   **Dynamic Suggestions:** Type-ahead suggestions based on indexed document titles using `rapidfuzz`.
    *   **Improved Interactivity:** Loading indicators (`Spin`) during searches/suggestions and debounced suggestion fetching.
    *   **User Feedback:** Clear error messages for search failures (Ant Design `message`).
    *   **Refined Styling:** Custom 'Inter' font, improved layout spacing, constrained content width, and styled components (Header, Cards).
    *   **Custom Branding:** Updated browser tab title and footer text.

---

## How It Works

The application operates in two main phases: Data Ingestion and Querying.

1.  **Data Ingestion (`backend/ingest_data.py`):**
    *   Reads configuration (`.env`).
    *   Loads source documents (e.g., ArXiv papers dataset).
    *   Generates vector embeddings for documents using ModernBERT (batched).
    *   Connects to Milvus.
    *   Creates (or drops/recreates) the Milvus collection (`modernbert_search` by default) with fields: `id`, `title`, `abstract`, `text`, `dense_vector`. Applies an `AUTOINDEX`.
    *   Inserts document metadata and embeddings in batches (memory-efficient).
    *   Flushes data to ensure persistence and loads the collection.
    *   Generates `indexed_titles.txt` for suggestions.

2.  **Querying (Backend + Frontend Interaction):**
    *   **Backend Startup:** Reads config, loads the embedding model, loads the Milvus collection via `lifespan`, loads suggestion titles.
    *   **Frontend Interaction:**
        *   User types query -> Debounced request to `/suggestions`.
        *   Backend uses `rapidfuzz` on `indexed_titles.txt` -> Returns suggestions.
        *   User submits search -> Request to `/search`.
    *   **Backend Processing:**
        *   Generates query embedding using ModernBERT (with `search_query:` prefix).
        *   Searches Milvus collection (using `COSINE` similarity) for top `k` matches, retrieving `title` and `abstract`.
        *   Handles Milvus/other exceptions, returning appropriate HTTP status codes.
        *   Formats results (`title`, `abstract`, `score`).
    *   **Frontend Display:**
        *   Receives results or error message.
        *   Displays results in styled cards, including expandable abstracts.
        *   Shows loading states and error notifications.

---

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
│   │   └── vite.svg      # Default favicon
│   ├── src/              # Frontend source code
│   │   ├── assets/
│   │   ├── components/   # React components (SearchBar, ResultsList)
│   │   ├── context/      # React contexts (ThemeContext)
│   │   ├── App.css
│   │   ├── App.tsx       # Main application component
│   │   ├── index.css     # Global styles
│   │   ├── main.tsx      # Application entry point
│   │   └── vite-env.d.ts
│   ├── eslint.config.js
│   ├── index.html        # Main HTML file
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
├── FRONTEND_IMPROVEMENT_PLAN.md # Development plan (optional)
├── IMPROVEMENT_PLAN.md   # Development plan (optional)
├── README.md             # This file
├── standalone_embed.sh   # Original Milvus setup script (optional)
├── system_design.png     # Architecture diagram image
├── embedEtcd.yaml        # Milvus configuration file (GITIGNORED)
└── user.yaml             # Milvus configuration file (GITIGNORED)
```

---

## Prerequisites

Ensure you have the following installed:

-   **Python:** 3.10+ (`python --version`)
-   **Node.js:** 16+ (`node --version`)
-   **Docker:** Latest version recommended (`docker --version`). Ensure the Docker daemon is running.
-   **Git:** For cloning and version control.

---

## Getting Started (Setup and Running)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/raoofaltaher/modernbert-semantic-search.git
    cd modernbert-semantic-search
    ```

2.  **Configure Environment:**
    *   **Backend:** Copy `backend/.env.example` to `backend/.env` (or create it) and verify/adjust settings like `MILVUS_URI`, `COLLECTION_NAME`, `EMBEDDING_MODEL`.
    *   **Frontend:** Copy `frontend/.env.example` to `frontend/.env` (or create it) and verify/adjust `VITE_API_BASE_URL`.

3.  **Start Milvus:**
    Run the following command from the project root. *Ensure the absolute paths in the `-v` arguments match your project location.*
    ```bash
    # Make sure Docker Desktop is running!
    # Replace 'PATH' below with your project path
    docker run -d --name milvus-standalone --security-opt seccomp:unconfined -e ETCD_USE_EMBED=true -e ETCD_DATA_DIR=/var/lib/milvus/etcd -e ETCD_CONFIG_PATH=/milvus/configs/embedEtcd.yaml -e COMMON_STORAGETYPE=local -v 'PATH'/modernbert-semantic-search/volumes/milvus:/var/lib/milvus -v 'PATH'/modernbert-semantic-search/embedEtcd.yaml:/milvus/configs/embedEtcd.yaml -v d:/A+Code_Projects/modernbert-semantic-search/user.yaml:/milvus/configs/user.yaml -p 19530:19530 -p 9091:9091 -p 2379:2379 --health-cmd="curl -f http://localhost:9091/healthz" --health-interval=30s --health-start-period=90s --health-timeout=20s --health-retries=3 milvusdb/milvus:v2.5.10 milvus run standalone
    ```
    Check status: `docker ps`

4.  **Backend Setup:**
    *   `cd backend`
    *   `python -m venv venv`
    *   Activate environment (e.g., `.\venv\Scripts\Activate.ps1` on PowerShell)
    *   `pip install -r requirements.txt`
    *   **Run Data Ingestion (Run Once):** `python ingest_data.py` (Wait for completion and title file generation).
    *   Start Server: `uvicorn main:app --host 0.0.0.0 --port 8050 --reload` (API at `http://localhost:8050`).

5.  **Frontend Setup:**
    *   Open a **new terminal**.
    *   `cd frontend`
    *   `npm install`
    *   Start Dev Server: `npm run dev` (Check terminal for URL, likely `http://localhost:5173`).

6.  **Access App:** Open the frontend URL (e.g., `http://localhost:5173`) in your browser.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgments

-   **ModernBERT:** [Hugging Face ModernBERT Blog](https://huggingface.co/blog/modernbert)
-   **Milvus:** [Milvus Documentation](https://milvus.io/docs)
-   **Sentence Transformers:** [sbert.net](https://www.sbert.net/)
-   **FastAPI:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
-   **React + Vite:** [react.dev](https://react.dev/), [vitejs.dev](https://vitejs.dev/)
-   **Ant Design:** [ant.design](https://ant.design/)
-   **Rapidfuzz:** [github.com/maxbachmann/RapidFuzz](https://github.com/maxbachmann/RapidFuzz)
