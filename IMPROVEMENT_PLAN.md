# ModernBERT Semantic Search - Improvement Plan

This document outlines the step-by-step plan to implement improvements across the backend and frontend of the semantic search application.

---

## Phase 1: Foundational Improvements

### 1. Configuration Management (Backend)

*   **Goal:** Move hardcoded configuration values to a `.env` file for better management and security.
*   **Steps:**
    1.  **Create `.env` file:** Create a file named `.env` in the `backend/` directory.
    2.  **Add variables to `backend/.env`:**
        ```dotenv
        MILVUS_URI=http://localhost:19530
        COLLECTION_NAME=modernbert_search
        EMBEDDING_MODEL=nomic-ai/modernbert-embed-base
        ```
    3.  **Modify `backend/query_engline.py`:**
        *   Add imports: `import os`, `from dotenv import load_dotenv`.
        *   Load environment variables at the top: `load_dotenv()`.
        *   Update client initialization:
            ```python
            client = MilvusClient(
                uri=os.getenv("MILVUS_URI", "http://localhost:19530") # Add default fallback
            )
            ```
    4.  **Modify `backend/main.py`:**
        *   Add imports: `import os`, `from dotenv import load_dotenv`.
        *   Load environment variables near the top: `load_dotenv()`.
        *   Replace hardcoded values:
            ```python
            # Near top of file, after imports and load_dotenv()
            COLLECTION_NAME = os.getenv("COLLECTION_NAME", "modernbert_search")
            MODEL_NAME = os.getenv("EMBEDDING_MODEL", "nomic-ai/modernbert-embed-base")
            MILVUS_URI = os.getenv("MILVUS_URI", "http://localhost:19530") # Needed for lifespan

            # Update model loading
            model = SentenceTransformer(MODEL_NAME)

            # Update collection name usage (e.g., in search_papers)
            # client.search(collection_name=COLLECTION_NAME, ...)
            ```
        *   *Note: Ensure `client` is imported correctly if needed for lifespan.*
    5.  **Modify `backend/ingest_data.py`:**
        *   Ensure `import os` and `from dotenv import load_dotenv` are present.
        *   Ensure `load_dotenv()` is called.
        *   Replace hardcoded values:
            ```python
            # Update model loading
            MODEL_NAME = os.getenv("EMBEDDING_MODEL", "nomic-ai/modernbert-embed-base")
            model = SentenceTransformer(MODEL_NAME, cache_folder=str(cache_dir))

            # Update Milvus connection details
            MILVUS_URI = os.getenv("MILVUS_URI", "http://localhost:19530")
            COLLECTION_NAME = os.getenv("COLLECTION_NAME", "modernbert_search")
            client = MilvusClient(uri=MILVUS_URI)
            # ... use COLLECTION_NAME variable throughout
            ```

### 2. Configuration Management (Frontend)

*   **Goal:** Move the hardcoded backend API URL to a `.env` file.
*   **Steps:**
    1.  **Create `.env` file:** Create a file named `.env` in the `frontend/` directory.
    2.  **Add variable to `frontend/.env`:**
        ```dotenv
        VITE_API_BASE_URL=http://localhost:8050
        ```
        *(Note: Vite requires environment variables exposed to the client to be prefixed with `VITE_`)*
    3.  **Modify `frontend/src/App.tsx`:**
        *   Update the `fetch` URL in `handleSearch`:
            ```typescript
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/search?query=${encodeURIComponent(query)}`;
            const response = await fetch(apiUrl);
            ```
    4.  **Modify `frontend/src/components/SearchBar.tsx`:**
        *   Update the `fetch` URL in `handleSearch` (for suggestions):
            ```typescript
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/suggestions?query=${encodeURIComponent(query)}`;
            const response = await fetch(apiUrl);
            ```
    5.  **Restart Frontend:** Stop and restart the Vite development server (`npm run dev`) for the `.env` changes to take effect.

### 3. Ensure Milvus Collection Loading (Backend)

*   **Goal:** Load the Milvus collection into memory when the FastAPI application starts.
*   **Steps:**
    1.  **Modify `backend/main.py`:**
        *   Add imports: `from contextlib import asynccontextmanager`, `from pymilvus import MilvusException` (if not already imported), `from fastapi import HTTPException`.
        *   Import the `client` instance: `from query_engline import client`.
        *   Define the lifespan context manager:
            ```python
            @asynccontextmanager
            async def lifespan(app: FastAPI):
                # Load the client and environment variables
                print("Application startup: Loading Milvus collection...")
                try:
                    # Ensure collection exists before loading (optional but good practice)
                    if not client.has_collection(COLLECTION_NAME):
                         print(f"Collection {COLLECTION_NAME} not found. Please run ingest_data.py first.")
                         # Decide behavior: raise error, exit, or continue without loading
                         # For now, we'll print a warning and continue, search will fail later.
                    else:
                        client.load_collection(COLLECTION_NAME)
                        print(f"Milvus collection '{COLLECTION_NAME}' loaded.")
                except MilvusException as e:
                    print(f"ERROR: Failed to load Milvus collection '{COLLECTION_NAME}': {e}")
                    # Optionally raise an exception here to prevent app startup if Milvus is critical
                except Exception as e:
                    print(f"ERROR: An unexpected error occurred during Milvus loading: {e}")

                yield # Application runs here

                # Clean up resources (optional)
                print("Application shutdown: Releasing Milvus collection...")
                try:
                    if client.has_collection(COLLECTION_NAME): # Check again in case it was dropped
                         client.release_collection(COLLECTION_NAME)
                         print(f"Milvus collection '{COLLECTION_NAME}' released.")
                except MilvusException as e:
                    print(f"ERROR: Failed to release Milvus collection '{COLLECTION_NAME}': {e}")
                except Exception as e:
                    print(f"ERROR: An unexpected error occurred during Milvus release: {e}")
            ```
        *   Update FastAPI app initialization: `app = FastAPI(lifespan=lifespan)`
        *   Remove the top-level `print(client.has_collection(collection_name))` line.

### 4. Refine Search Result Data (Backend)

*   **Goal:** Retrieve the `title` directly from Milvus instead of parsing the combined `text`.
*   **Steps:**
    1.  **Modify `backend/main.py` -> `search_papers` function:**
        *   Update `output_fields`:
            ```python
            result = client.search(
                collection_name=COLLECTION_NAME, # Use variable
                data=[query_embeddings],
                anns_field="dense_vector",
                limit=max_results,
                output_fields=["title"], # Retrieve only title and score (distance)
                search_params={"metric_type": "COSINE"}
            )
            ```
        *   Update result processing:
            ```python
            records = [
                {"title": paper["entity"]["title"], "score": paper["distance"]} # Directly use title field
                for paper in result[0]
            ]
            ```

### 5. Fix Frontend Result Handling

*   **Goal:** Align the frontend state with the actual data structure returned by the backend.
*   **Steps:**
    1.  **Modify `frontend/src/App.tsx`:**
        *   Change the `results` state definition:
            ```typescript
            const [results, setResults] = useState<{ title: string; score: number }[]>([]);
            ```
        *   Ensure the `handleSearch` function correctly sets this state based on the API response.

---

## Phase 2: User Experience & Robustness

### 6. Improve Error Handling (Backend)

*   **Goal:** Provide more specific error feedback from the API.
*   **Steps:**
    1.  **Modify `backend/main.py` -> `search_papers` function:**
        *   Wrap the `client.search(...)` call:
            ```python
            try:
                result = client.search(...) # Existing search call
            except MilvusException as e:
                print(f"ERROR: Milvus search error in collection '{COLLECTION_NAME}': {e}")
                # Provide a user-friendly message, potentially hiding internal details
                raise HTTPException(status_code=503, detail=f"Search service unavailable: {e.code} {e.message}")
            except Exception as e:
                print(f"ERROR: Unexpected error during search: {e}")
                raise HTTPException(status_code=500, detail="Internal server error during search.")
            ```
        *   Ensure `HTTPException` is imported from `fastapi`.
    2.  **Modify `backend/main.py` -> `get_suggestions` function:**
        *   Wrap the file reading and `extract` logic:
            ```python
            try:
                # Existing logic to open file and extract suggestions
                with open("all_queries.txt", "r") as f:
                    all_queries = [line.strip() for line in f.readlines()]
                matches = extract(query, all_queries, limit=max_results)
                suggestions = [match[0] for match in matches]
            except FileNotFoundError:
                 print("ERROR: all_queries.txt not found.")
                 # Return empty list or specific error
                 return {"query": query, "suggestions": []} # Or raise HTTPException(500)
            except Exception as e:
                print(f"ERROR: Failed to get suggestions: {e}")
                raise HTTPException(status_code=500, detail="Failed to process suggestions.")
            ```

### 7. Improve Error Handling (Frontend)

*   **Goal:** Show user-friendly error messages in the UI.
*   **Steps:**
    1.  **Modify `frontend/src/App.tsx`:**
        *   Add import: `import { message } from 'antd';`.
        *   Update `handleSearch`'s `catch` block:
            ```typescript
            catch (error) {
                console.error('Error fetching search results:', error);
                message.error('Search failed. Could not connect to the backend or an error occurred.');
                setResults([]); // Clear previous results on error
            }
            ```
    2.  **Modify `frontend/src/components/SearchBar.tsx`:**
        *   Add import: `import { message } from 'antd';`.
        *   Update `handleSearch`'s (suggestions fetch) `catch` block:
            ```typescript
            catch (error) {
                console.error('Error fetching suggestions:', error);
                // Optional: show a subtle error or just log it
                // message.error('Could not fetch suggestions.');
                setOptions([]);
            }
            ```

### 8. Add Loading Indicators (Frontend)

*   **Goal:** Provide visual feedback during API calls.
*   **Steps:**
    1.  **Modify `frontend/src/App.tsx`:**
        *   Add loading state: `const [loading, setLoading] = useState<boolean>(false);`.
        *   Update `handleSearch`:
            ```typescript
            const handleSearch = async (query: string) => {
                if (!query) {
                    setResults([]);
                    return;
                }
                setLoading(true); // Start loading
                try {
                    // ... fetch logic ...
                    setResults(data.results);
                } catch (error) {
                    // ... error handling ...
                } finally {
                    setLoading(false); // Stop loading regardless of success/error
                }
            };
            ```
        *   Pass `loading` prop to `ResultsList`: `<ResultsList results={results} loading={loading} />`.
    2.  **Modify `frontend/src/components/ResultsList.tsx`:**
        *   Add import: `import { Spin } from 'antd';`.
        *   Update props interface: `interface ResultsListProps { results: { title: string; score: number }[]; loading: boolean; }`.
        *   Update component return:
            ```typescript
            return (
                <Spin spinning={loading} tip="Searching..." style={{ width: '100%', marginTop: '20px' }}>
                    <List
                        // ... existing list props ...
                    />
                </Spin>
            );
            ```
    3.  **Modify `frontend/src/components/SearchBar.tsx`:**
        *   Add loading state: `const [suggestLoading, setSuggestLoading] = useState<boolean>(false);`.
        *   Update `handleSearch` (suggestions fetch):
            ```typescript
             const fetchSuggestions = async (query: string) => {
                 if (!query) {
                     setOptions([]);
                     return;
                 }
                 setSuggestLoading(true); // Start suggestions loading
                 try {
                     // ... fetch logic ...
                     setOptions(data.suggestions.map((item: string) => ({ value: item })));
                 } catch (error) {
                     // ... error handling ...
                     setOptions([]);
                 } finally {
                     setSuggestLoading(false); // Stop suggestions loading
                 }
             };
             // ... (use fetchSuggestions, potentially debounced - see next step)
            ```
        *   Update `AutoComplete` component:
            ```typescript
            <AutoComplete
                // ... other props ...
            >
                <Input.Search
                    // ... other props ...
                    loading={suggestLoading} // Show loading indicator on the input
                />
            </AutoComplete>
            ```

### 9. Debounce Suggestions Input (Frontend)

*   **Goal:** Reduce unnecessary API calls for suggestions while typing.
*   **Steps:**
    1.  **Install dependency:** Run `npm install lodash.debounce @types/lodash.debounce` in the `frontend` directory.
    2.  **Modify `frontend/src/components/SearchBar.tsx`:**
        *   Add imports: `import debounce from 'lodash.debounce';`, `import { useMemo } from 'react';`.
        *   Refactor suggestion fetching logic into a standalone async function (like `fetchSuggestions` from the previous step).
        *   Create a debounced version of the fetch function using `useMemo`:
            ```typescript
            const debouncedFetchSuggestions = useMemo(
                () => debounce(fetchSuggestions, 300), // 300ms delay
                [] // Dependencies array - empty if fetchSuggestions doesn't depend on props/state
            );
            ```
        *   Update the `onSearch` prop of the `AutoComplete` component to call the debounced function:
            ```typescript
            <AutoComplete
                options={options}
                onSearch={debouncedFetchSuggestions} // Use the debounced function
                onSelect={handleSelect}
                style={{ width: '100%' }}
            >
                {/* ... Input.Search ... */}
            </AutoComplete>
            ```

---

## Phase 3: Advanced Features & Refinements

*(These steps are more involved and may require further design choices)*

### 10. Enhance Result Display (Backend)

*   **Goal:** Return more data (like abstract) for richer display.
*   **Steps:**
    1.  **Modify `backend/ingest_data.py` (Optional but Recommended):**
        *   Add a separate `abstract` field to the Milvus schema: `schema.add_field(field_name="abstract", datatype=DataType.VARCHAR, max_length=max_text_length)`.
        *   Update the `data_to_insert` preparation to include the `abstract`: `{"title": row["title"], "text": row["text"], "abstract": row["abstract"], "dense_vector": row["embeddings"]}`.
        *   Re-run the ingestion script.
    2.  **Modify `backend/main.py` -> `search_papers` function:**
        *   Update `output_fields`: `output_fields=["title", "abstract"]` (if abstract field was added) OR `output_fields=["title", "text"]` (if parsing from text).
        *   Update result processing to include the abstract:
            ```python
            # If abstract field exists:
            records = [
                {"title": paper["entity"]["title"], "score": paper["distance"], "abstract": paper["entity"]["abstract"]}
                for paper in result[0]
            ]
            # If parsing from text (less ideal):
            # records = []
            # for paper in result[0]:
            #     full_text = paper["entity"]["text"]
            #     title = paper["entity"]["title"] # Assuming title is still retrieved or available
            #     # Basic parsing (adjust based on actual prefix/separator used in ingest_data)
            #     abstract = full_text.replace(document_prefix, "").replace(title, "").strip()
            #     records.append({"title": title, "score": paper["distance"], "abstract": abstract})

            ```

### 11. Enhance Result Display (Frontend)

*   **Goal:** Display the abstract or other details in the results list.
*   **Steps:**
    1.  **Modify `frontend/src/App.tsx`:**
        *   Update the `results` state definition to include `abstract`: `useState<{ title: string; score: number; abstract: string }[]>([]);`.
    2.  **Modify `frontend/src/components/ResultsList.tsx`:**
        *   Update `ResultsListProps` interface: `interface ResultsListProps { results: { title: string; score: number; abstract: string }[]; loading: boolean; }`.
        *   Update the `renderItem` function:
            ```typescript
             renderItem={(item) => (
                 <List.Item>
                     <Card /* ... existing props ... */ >
                         <div>
                             <Typography.Title level={5} style={{ fontWeight: 'bold' }}>
                                 {item.title}
                             </Typography.Title>
                             <Typography.Paragraph>
                                 Relevance Score: {parseFloat(item.score.toFixed(4))}
                             </Typography.Paragraph>
                             <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                                 {item.abstract}
                             </Typography.Paragraph>
                         </div>
                     </Card>
                 </List.Item>
             )}
            ```

### 12. Optimize Data Ingestion (Backend)

*   **Goal:** Reduce memory usage during ingestion for large datasets.
*   **Steps:**
    1.  **Modify `backend/ingest_data.py`:**
        *   Remove the line: `df = embeddings_ds.to_pandas()`.
        *   Remove the Pandas-based length calculation: `df['text_length'] = ...`, `max_text_length = ...`. Determine `max_text_length` differently if needed (e.g., iterate once or use a safe large value like 65530).
        *   Remove the Pandas-based data preparation loop: `data_to_insert = [...] for index, row in df.iterrows()`.
        *   Modify the insertion loop:
            ```python
            batch_size = 100 # Or adjust based on memory/performance
            print(f"Inserting {len(embeddings_ds)} records in batches of {batch_size}...")

            for i in tqdm(range(0, len(embeddings_ds), batch_size)):
                batch_indices = range(i, min(i + batch_size, len(embeddings_ds)))
                batch_ds = embeddings_ds.select(batch_indices)

                # Prepare batch data directly from the Hugging Face dataset batch
                batch_data = [
                    {
                        "title": batch_ds[j]["title"],
                        # Get abstract separately if stored, otherwise parse from text
                        "abstract": batch_ds[j]["abstract"], # Assuming abstract is available
                        "text": batch_ds[j]["text"], # Still needed if abstract isn't separate
                        "dense_vector": batch_ds[j]["embeddings"]
                    }
                    for j in range(len(batch_ds))
                ]

                try:
                    res = client.insert(collection_name=COLLECTION_NAME, data=batch_data)
                except Exception as e:
                    print(f"Error inserting batch starting at index {i}: {e}")
                    break
            ```
        *   *Note: This requires ensuring the `abstract` field is correctly populated in `batch_ds` if you added it earlier.*

### 13. Improve Suggestions (Backend)

*   **Goal:** Use actual indexed titles for suggestions instead of a static file.
*   **Steps (Option A - Simpler):**
    1.  **Modify `backend/ingest_data.py`:**
        *   After generating `embeddings_ds`, extract all titles: `all_titles = embeddings_ds["title"]`.
        *   Save titles to a file:
            ```python
            titles_file = "indexed_titles.txt"
            with open(titles_file, "w", encoding="utf-8") as f:
                for title in all_titles:
                    f.write(f"{title}\n")
            print(f"Saved {len(all_titles)} titles to {titles_file}")
            ```
    2.  **Modify `backend/main.py`:**
        *   Change the file read near the top:
            ```python
            SUGGESTION_FILE = "indexed_titles.txt"
            try:
                with open(SUGGESTION_FILE, "r", encoding="utf-8") as f:
                    all_suggestions = [line.strip() for line in f.readlines()]
            except FileNotFoundError:
                print(f"Warning: Suggestion file '{SUGGESTION_FILE}' not found. Suggestions disabled.")
                all_suggestions = []
            ```
        *   Update `get_suggestions` to use `all_suggestions`.
    3.  **Add `indexed_titles.txt` to `backend/.gitignore`.**

### 14. Refactor & Async (Backend)

*   **Goal:** Improve code organization and potentially performance.
*   **Steps (High-level):**
    1.  Create `backend/services/milvus_service.py`.
    2.  Define a `MilvusService` class.
    3.  Move Milvus client initialization (`MilvusClient(...)`) into the service's `__init__`.
    4.  Move collection loading/releasing logic into methods like `load()` and `release()`.
    5.  Move search logic (`client.search(...)` and result processing) into a `search(...)` method within the service.
    6.  Update `main.py` to instantiate and use `MilvusService`. Pass the service instance around or use dependency injection.
    7.  Update `ingest_data.py` similarly if it needs Milvus operations beyond basic client usage.
    8.  Research `pymilvus` documentation for native async methods for search/insert and refactor relevant service methods to use `async/await` if applicable and beneficial. Update FastAPI endpoint functions (`async def search(...)`) accordingly.

### 15. Add Testing

*   **Goal:** Ensure code correctness and prevent regressions.
*   **Steps (High-level):**
    1.  **Backend:**
        *   Install test dependencies: `pip install pytest pytest-asyncio httpx`.
        *   Create `backend/tests/` directory.
        *   Write unit tests for utility functions (if any).
        *   Write integration tests for API endpoints in `backend/tests/test_main.py` using `from fastapi.testclient import TestClient`. Mock the `MilvusService` or `client` interactions to avoid dependency on a running Milvus instance during tests. Use `httpx` for mocking external calls if needed.
    2.  **Frontend:**
        *   Install test dependencies: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`.
        *   Configure `vite.config.ts` for testing with `vitest`.
        *   Create `*.test.tsx` files alongside components (e.g., `frontend/src/components/SearchBar.test.tsx`).
        *   Write tests using `@testing-library/react` to render components, simulate user interactions (typing, clicking), and assert on the rendered output or state changes. Mock `fetch` calls using `vitest.fn()` or libraries like `msw`.

---

This detailed plan provides a clear path forward. Please review it. Once you're satisfied, **toggle to Act mode**, and I can begin implementing Phase 1.