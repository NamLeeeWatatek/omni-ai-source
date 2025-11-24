from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, bots, flows, channels, conversations, webhooks, ai, executions

app = FastAPI(
    title="WataOmi API",
    description="AI-powered omnichannel customer engagement platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3003", "https://wataomi.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(bots.router, prefix="/api/v1/bots", tags=["bots"])
app.include_router(flows.router, prefix="/api/v1/flows", tags=["flows"])
app.include_router(executions.router, prefix="/api/v1/executions", tags=["executions"])
app.include_router(channels.router, prefix="/api/v1/channels", tags=["channels"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

@app.get("/")
async def root():
    return {
        "message": "WataOmi API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
