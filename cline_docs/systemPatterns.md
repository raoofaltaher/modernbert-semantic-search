# System Patterns

## Architecture Overview

This is a full-stack application with a distinct separation between the backend API and the frontend user interface. It leverages a specialized vector database for its core search functionality.

-   **Backend:** A Python API built with FastAPI, responsible for handling search requests, generating embeddings, interacting with the vector database, and providing suggestions.
-   **Frontend:** A modern web application built with Vite, React, and TypeScript, providing the user interface for searching and displaying results. Uses Ant Design for UI components.
-   **Vector Database:** Milvus, running as a Docker container, stores and indexes document embeddings for efficient semantic search. Data persistence is handled via Docker volumes.
-   **Data Ingestion:** A dedicated Python script (`backend/ingest_data.py`) processes source documents, generates embeddings using a sentence transformer model, and populates the Milvus collection. This is typically a one-off or periodic process.

## Key Technical Decisions & Patterns

-   **Semantic Search Core:** The central pattern is converting text (documents and queries) into dense vector embeddings and using cosine similarity search within Milvus to find semantically related items.
-   **Decoupled Ingestion:** Data processing and loading into Milvus are handled by a separate script (`ingest_data.py`), keeping the main API focused on serving requests.
-   **Batch Processing:** The ingestion script uses batching for generating embeddings and inserting data into Milvus to manage memory usage effectively.
-   **Explicit Milvus Collection Loading:** The FastAPI backend uses the `lifespan` event handler to explicitly load the required Milvus collection on startup, ensuring it's ready before serving requests and improving robustness.
-   **Configuration Management:** Environment variables (`.env` files) are used in both the backend and frontend to manage configurable settings like API endpoints, Milvus connection details, model names, etc.
-   **Type-Ahead Suggestions:** Suggestions are implemented using `rapidfuzz` on the backend, searching against a pre-generated flat file (`indexed_titles.txt`) derived during ingestion. This avoids hitting the main database for simple title suggestions.
-   **State Management (Frontend):** React Context (`ThemeContext`) is used for managing global state like the theme (light/dark mode). Local component state handles UI aspects like loading indicators and search inputs.
-   **Error Handling:** The backend provides specific HTTP status codes (e.g., 503 for Milvus connection issues). The frontend uses UI components (Ant Design `message`) to display user-friendly error feedback.
-   **Styling:** Global CSS (`index.css`), component-specific CSS (`App.css`), and Ant Design's styling capabilities are used. Theme customization is applied via Ant Design's configuration provider.
-   **Containerization:** Docker is used to manage the Milvus instance, simplifying setup and ensuring a consistent environment for the vector database.
