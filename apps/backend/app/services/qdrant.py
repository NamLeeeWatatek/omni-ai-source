from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
        self.collection_name = "knowledge-base"

    def create_collection_if_not_exists(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )

    def upsert_vectors(self, points: list):
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            return True
        except Exception as e:
            print(f"Error upserting vectors to Qdrant: {e}")
            return False

    def search(self, vector: list, limit: int = 5):
        try:
            return self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=limit
            )
        except Exception as e:
            print(f"Error searching Qdrant: {e}")
            return []

qdrant_service = QdrantService()
