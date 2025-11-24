# WataOmi Integration Guide

This guide details how to set up the backend and frontend integrations for WataOmi.

## 1. Database Setup (Supabase)

1.  Log in to your Supabase project: `https://ryjjlknwuelsyfseavqc.supabase.co`
2.  Go to the **SQL Editor**.
3.  Copy the content of `apps/backend/supabase_schema.sql` and run it to create the necessary tables (`flows`, `workflow_executions`, `node_executions`).

## 2. Backend Setup

### Environment Variables
The `.env` file in `apps/backend/.env` has been created with your provided keys.
**Action Required:** You need to fill in the **Casdoor** configuration:
```env
CASDOOR_ENDPOINT=https://door.casdoor.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_CERTIFICATE=your_certificate
CASDOOR_ORG_NAME=your_org_name
CASDOOR_APP_NAME=your_app_name
```

### Install Dependencies
```bash
cd apps/backend
pip install -r requirements.txt
# OR if using poetry
poetry install
```
*Note: I have added `supabase`, `google-generativeai`, `qdrant-client`, `cloudinary`, `casdoor-python-sdk` to `pyproject.toml`.*

### Run Backend
```bash
cd apps/backend
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

## 3. Frontend Setup

### Environment Variables
The `.env.local` file in `apps/web/.env.local` has been created.
**Action Required:** Update the **Casdoor** configuration to match your Casdoor application:
```env
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your_client_id
NEXT_PUBLIC_CASDOOR_APP_NAME=your_app_name
NEXT_PUBLIC_CASDOOR_ORG_NAME=your_org_name
```

### Casdoor Login Flow
- The frontend uses `casdoor-js-sdk`.
- The callback page is at `/callback`.
- Ensure your Casdoor Application has `http://localhost:3001/callback` as a valid Redirect URI.

## 4. Services Integrated

-   **Google Gemini**: Used in `GeminiService` for AI nodes.
-   **Qdrant**: Used in `QdrantService` for vector search.
-   **Cloudinary**: Used in `CloudinaryService` for media uploads.
-   **Supabase**: Used as the primary database for workflows and executions.
-   **Casdoor**: Used for authentication (Frontend Login & Backend Token Verification).

## 5. Testing Execution
1.  Create a workflow in the UI.
2.  Click "Execute" (or use the Test button).
3.  The backend will:
    -   Create an execution record in Supabase.
    -   Run the workflow logic in a background task.
    -   Call Gemini/Qdrant/Cloudinary based on node types.
    -   Update execution status in Supabase.
4.  Check the "Executions" tab to see the result.
