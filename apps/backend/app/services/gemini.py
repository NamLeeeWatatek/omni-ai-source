import google.generativeai as genai
from app.core.config import settings

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def generate_content(self, prompt: str, model_name: str = "gemini-2.5-flash") -> str:
        try:
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating content with Gemini (Model: {model_name}): {e}")
            import traceback
            traceback.print_exc()
            return None

    async def suggest_next_node(self, current_node_type: str, workflow_context: str) -> dict:
        prompt = f"""
        Given a workflow with the current node type '{current_node_type}' and the following context:
        {workflow_context}
        
        Suggest the next logical node type and a brief explanation.
        Return JSON format: {{ "suggested_node": "node_type", "reason": "explanation" }}
        """
        response = await self.generate_content(prompt)
        # Basic parsing, in production use structured output or better parsing
        return response

gemini_service = GeminiService()
