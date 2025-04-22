import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
from datasets import load_dataset
from pymilvus import MilvusClient, DataType
from tqdm import tqdm
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from environment variables
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "nomic-ai/modernbert-embed-base")
MILVUS_URI = os.getenv("MILVUS_URI", "http://localhost:19530")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "modernbert_search")

print("Step 1: Load the ModernBERT Model")
# Load the SentenceTransformer model
# Using a local cache directory within the project to avoid potential permission issues
cache_dir = Path("./model_cache")
cache_dir.mkdir(exist_ok=True)
print(f"Loading embedding model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME, cache_folder=str(cache_dir))
print("Embedding model loaded.")

# Function to generate embeddings for a single text
def generate_embeddings_func(text: str):
    return model.encode(text)

print("Step 2: Prepare the Dataset")
# Load the dataset
ds = load_dataset("CShorten/ML-ArXiv-Papers")

# Keep only "title" and "abstract" columns in train set
train_ds = ds["train"].select_columns(["title", "abstract"])

# Shuffle the dataset and select the first 1000 rows for demo
print("Selecting and shuffling 1000 rows...")
small_dataset = train_ds.shuffle(seed=57).select(range(1000))

document_prefix = "search_document:"

# Concatenate abstract and titles
def combine_text(row):
    row["text"] = document_prefix + " " + row["title"] + " " + row["abstract"]
    return row

print("Combining title and abstract...")
small_dataset = small_dataset.map(combine_text)

print(f"Number of rows to process: {len(small_dataset)}")

print("Step 3: Generate Embeddings for the Dataset")
# Function to generate embeddings for a batch
def generate_embeddings_batch(batch):
    # Ensure 'text' column exists
    if "text" not in batch:
        raise ValueError("Input batch must contain a 'text' column.")
    
    # Filter out None or empty strings if any, though combine_text should prevent this
    texts_to_encode = [text for text in batch["text"] if text]
    if not texts_to_encode:
        batch["embeddings"] = []
        return batch

    embeddings = model.encode(texts_to_encode)
    
    # Map embeddings back, handling potential empty texts
    embedding_iter = iter(embeddings)
    batch_embeddings = []
    for text in batch["text"]:
        if text:
            batch_embeddings.append(next(embedding_iter))
        else:
            # Assign a zero vector or handle as appropriate if empty texts were possible
            batch_embeddings.append([0.0] * model.get_sentence_embedding_dimension()) 
            
    batch["embeddings"] = batch_embeddings
    return batch


print("Generating embeddings (this might take a while)...")
# Apply the function to the dataset using map with batching
embeddings_ds = small_dataset.map(generate_embeddings_batch, batched=True, batch_size=32) # Adjust batch_size based on memory

# --- Remove Pandas DataFrame conversion ---
# print("Converting to Pandas DataFrame...")
# df = embeddings_ds.to_pandas()

# --- Determine max_text_length differently or use a safe default ---
# Option 1: Iterate once (might still be memory intensive for huge datasets)
# print("Calculating max text length by iteration...")
# max_len_found = 0
# for item in tqdm(embeddings_ds):
#     max_len_found = max(max_len_found, len(item['text']))
# max_text_length = min(max_len_found, 65530)

# Option 2: Use a safe, large default value (simpler, less precise)
print("Using safe default max text length for VARCHAR.")
max_text_length = 65530 # Use a large but safe default for Milvus VARCHAR

print(f"Max text length (capped/default): {max_text_length}")

print("Step 4: Set Up the Milvus Vector Database")
# Milvus connection details from environment variables
DIMENSION = model.get_sentence_embedding_dimension() # Get dimension from model

print(f"Connecting to Milvus at {MILVUS_URI}...")
client = MilvusClient(uri=MILVUS_URI) # Use variable

# Drop collection if it exists
if client.has_collection(COLLECTION_NAME): # Use variable
    print(f"Dropping existing collection: {COLLECTION_NAME}")
    client.drop_collection(COLLECTION_NAME) # Use variable

# Create schema
print("Creating schema...")
schema = MilvusClient.create_schema(
    auto_id=True, # Let Milvus handle primary key generation
    enable_dynamic_field=False, # Disable dynamic fields for clarity
)

# Add fields to schema
# Milvus automatically creates and populates the 'id' field when auto_id=True and is_primary=True.
schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True)
schema.add_field(field_name="title", datatype=DataType.VARCHAR, max_length=1024) # Add title field
schema.add_field(field_name="abstract", datatype=DataType.VARCHAR, max_length=max_text_length) # Add abstract field separately
schema.add_field(field_name="text", datatype=DataType.VARCHAR, max_length=max_text_length) # Keep combined text for potential future use or different search strategies
schema.add_field(field_name="dense_vector", datatype=DataType.FLOAT_VECTOR, dim=DIMENSION)

# Prepare index parameters
print("Preparing index parameters...")
index_params = client.prepare_index_params()

# Add index for the vector field
index_params.add_index(
    field_name="dense_vector",
    index_type="AUTOINDEX", # Let Milvus choose the best index
    metric_type="COSINE" # Use COSINE similarity
)

# Create collection
print(f"Creating collection: {COLLECTION_NAME} with dimension {DIMENSION}") # Use variable
client.create_collection(
    collection_name=COLLECTION_NAME, # Use variable
    schema=schema,
    index_params=index_params
)

print(f"Collection {COLLECTION_NAME} created successfully.") # Use variable

print("Step 5: Insert Data into Milvus")
# --- Insert data directly from dataset in batches ---
batch_size = 100 # Adjust based on memory/performance
print(f"Inserting {len(embeddings_ds)} records in batches of {batch_size}...")

for i in tqdm(range(0, len(embeddings_ds), batch_size)):
    # Select a batch from the Hugging Face dataset
    batch_indices = range(i, min(i + batch_size, len(embeddings_ds)))
    batch_ds = embeddings_ds.select(batch_indices)

    # Prepare batch data directly from the dataset batch
    batch_data = [
        {
            "title": batch_ds[j]["title"],
            "abstract": batch_ds[j]["abstract"], # Get abstract directly
            "text": batch_ds[j]["text"], # Keep combined text
            "dense_vector": batch_ds[j]["embeddings"]
        }
        for j in range(len(batch_ds))
    ]

    try:
        res = client.insert(collection_name=COLLECTION_NAME, data=batch_data) # Use variable
        # Optional: Check insertion results if needed
        # print(f"Inserted batch {i//batch_size + 1}, IDs: {res['insert_count']}")
    except Exception as e:
        print(f"Error inserting batch {i//batch_size + 1}: {e}")
        # Decide how to handle errors: break, continue, log, etc.
        break 

print("Data insertion complete.")
print("Flushing collection to ensure data persistence...")
client.flush(collection_name=COLLECTION_NAME) # Use variable
print("Flush complete.")

# Optional: Verify count after flushing and loading
try:
    print(f"Loading collection {COLLECTION_NAME} for verification...") # Use variable
    client.load_collection(collection_name=COLLECTION_NAME) # Use variable
    print("Collection loaded.")
    count = client.query(collection_name=COLLECTION_NAME, filter="", output_fields=["count(*)"]) # Use variable
    print(f"Verification: Number of entities in collection: {count[0]['count(*)']}")
except Exception as e:
    print(f"Could not verify entity count: {e}")

# --- Save titles for suggestions ---
try:
    print("Extracting titles for suggestions...")
    # Extract titles directly from the dataset (before embedding generation if possible, or after)
    # Using embeddings_ds here as it's readily available after the map operation
    all_titles = embeddings_ds["title"]
    titles_file = "indexed_titles.txt"
    with open(titles_file, "w", encoding="utf-8") as f:
        for title in all_titles:
            f.write(f"{title}\n")
    print(f"Saved {len(all_titles)} titles to {titles_file}")
except Exception as e:
    print(f"Error saving titles for suggestions: {e}")
# --- End save titles ---

print("Ingestion script finished.")
