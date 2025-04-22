import os
from dotenv import load_dotenv
from pymilvus import MilvusClient

load_dotenv() # Load variables from .env file

client = MilvusClient(
    uri=os.getenv("MILVUS_URI", "http://localhost:19530") # Add default fallback
)
