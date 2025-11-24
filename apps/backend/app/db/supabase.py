from supabase import create_client, Client
from app.core.config import settings

class SupabaseManager:
    _client: Client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return self._client

supabase_manager = SupabaseManager()

def get_supabase() -> Client:
    return supabase_manager.client
