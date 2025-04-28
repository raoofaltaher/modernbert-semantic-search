# Technical Context

## Core Technologies

-   **Backend:**
    -   Language: Python 3.10+
    -   Framework: FastAPI
    -   Dependencies:
        -   `sentence-transformers`: For loading and using the embedding model.
        -   `pymilvus`: Client library for interacting with Milvus.
        -   `python-dotenv`: For loading `.env` configuration.
        -   `uvicorn`: ASGI server for running FastAPI.
        -   `rapidfuzz`: For fuzzy string matching (suggestions).
        -   (See `backend/requirements.txt` for full list)
-   **Frontend:**
    -   Language: TypeScript
    -   Framework/Library: React
    -   Build Tool: Vite
    -   UI Library: Ant Design
    -   Dependencies:
        -   `react`, `react-dom`
        -   `antd`: UI components.
        -   `axios` (Likely, for API calls - verify `package.json`)
        -   `lodash.debounce` (Likely, for debouncing input - verify `package.json`)
        -   (See `frontend/package.json` for full list)
-   **Vector Database:**
    -   Milvus (Version `v2.5.10` specified in Docker command)
    -   Running via Docker.
    -   Similarity Metric: `COSINE`
    -   Index Type: `AUTOINDEX` (Milvus determines the best index based on data)
-   **Embedding Model:**
    -   `nomic-ai/modernbert-embed-base` (loaded via `sentence-transformers`)
    -   Model caching likely occurs in `backend/model_cache/`.
-   **Containerization:**
    -   Docker (for Milvus)

## Development Setup & Prerequisites

-   **Required Software:**
    -   Python 3.10+
    -   Node.js 16+
    -   Docker (daemon must be running)
    -   Git
-   **Backend Setup:**
    1.  Navigate to `backend/`.
    2.  Create/activate Python virtual environment (e.g., `python -m venv venv`, `.\venv\Scripts\Activate.ps1`).
    3.  Install dependencies: `pip install -r requirements.txt`.
    4.  Configure `backend/.env` (copy from `.env.example` if needed).
    5.  Run ingestion script (once): `python ingest_data.py`.
    6.  Start server: `uvicorn main:app --host 0.0.0.0 --port 8050 --reload`.
-   **Frontend Setup:**
    1.  Navigate to `frontend/`.
    2.  Install dependencies: `npm install`.
    3.  Configure `frontend/.env` (copy from `.env.example` if needed, especially `VITE_API_BASE_URL`).
    4.  Start dev server: `npm run dev`.
-   **Milvus Setup:**
    1.  Requires Docker running.
    2.  Run the `docker run` command provided in `README.md` (ensure paths in `-v` are correct).
    3.  Configuration files (`embedEtcd.yaml`, `user.yaml`) are mounted into the container.
    4.  Data is persisted in `volumes/milvus`.

## Technical Constraints & Considerations

-   **Milvus Dependency:** The application heavily relies on a running Milvus instance. Backend startup includes checks and loading the collection.
-   **Model Download:** The embedding model will be downloaded on the first run of the backend or ingestion script if not cached.
-   **Ingestion Time:** The initial data ingestion can take time depending on the dataset size and hardware.
-   **Environment Variables:** Correct configuration in `.env` files is crucial for connecting backend, frontend, and Milvus.
-   **Docker Paths:** Absolute paths in the `docker run` command for volume mounts must be correct for the user's system.
