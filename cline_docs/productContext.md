# Product Context: Semantic Document Search

## Why This Project Exists

This project aims to provide a more effective way to search through document collections (demonstrated with ArXiv papers) than traditional keyword-based methods.

## What Problems It Solves

-   **Limitations of Keyword Search:** Traditional search often fails to capture user intent or find documents related by meaning rather than exact words.
-   **Need for Contextual Relevance:** Users need to find documents based on conceptual similarity and context.

## How It Should Work

The application implements **semantic search** using vector embeddings and a vector database:

1.  **Data Ingestion:**
    *   Documents (e.g., ArXiv papers) are processed.
    *   Vector embeddings are generated for each document using a sentence transformer model (`nomic-ai/modernbert-embed-base`).
    *   These embeddings, along with document metadata (ID, title, abstract, text), are stored and indexed in a Milvus vector database.
    *   A list of titles is saved for suggestion functionality.
2.  **Querying:**
    *   The user enters a search query in the frontend interface.
    *   Type-ahead suggestions based on document titles are provided using `rapidfuzz`.
    *   When a search is submitted:
        *   The backend generates an embedding for the query (with a specific prefix).
        *   The backend searches the Milvus database for vectors (documents) with the highest cosine similarity to the query vector.
        *   The backend returns the top matching documents (title, abstract, score) to the frontend.
    *   The frontend displays the results, allowing users to see titles and expand abstracts.
    *   The system includes features like loading indicators, error handling, and theme customization (light/dark mode).
