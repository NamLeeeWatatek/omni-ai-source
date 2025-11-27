from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import (
    auth, bots, flows, channels, conversations, executions, 
    webhooks, integrations, templates, media, agent_configs, 
    versions, archives, stats, oauth, node_types, executions_stream, websocket
)
from app.api.v1 import ai
from app.db.session import init_db
from app.core.config import settings

app = FastAPI(
    title="WataOmi API",
    description="AI-powered omnichannel customer engagement platform",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(bots.router, prefix=f"{settings.API_V1_STR}/bots", tags=["bots"])
app.include_router(flows.router, prefix=f"{settings.API_V1_STR}/flows", tags=["flows"])
app.include_router(versions.router, prefix=f"{settings.API_V1_STR}/flows", tags=["versions"])
app.include_router(channels.router, prefix=f"{settings.API_V1_STR}/channels", tags=["channels"])
app.include_router(conversations.router, prefix=f"{settings.API_V1_STR}/conversations", tags=["conversations"])
app.include_router(executions.router, prefix=f"{settings.API_V1_STR}/executions", tags=["executions"])
app.include_router(executions_stream.router, prefix=f"{settings.API_V1_STR}/executions", tags=["executions-stream"])
# Centralized WebSocket router
app.include_router(websocket.router, prefix=f"{settings.API_V1_STR}", tags=["websocket"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(stats.router, prefix=f"{settings.API_V1_STR}/stats", tags=["stats"])
app.include_router(oauth.router, prefix=f"{settings.API_V1_STR}/oauth", tags=["oauth"])
app.include_router(integrations.router, prefix=f"{settings.API_V1_STR}/integrations", tags=["integrations"])
app.include_router(templates.router, prefix=f"{settings.API_V1_STR}/templates", tags=["templates"])
app.include_router(media.router, prefix=f"{settings.API_V1_STR}/media", tags=["media"])
app.include_router(agent_configs.router, prefix=f"{settings.API_V1_STR}/agent-configs", tags=["agent-configs"])
app.include_router(archives.router, prefix=f"{settings.API_V1_STR}/archives", tags=["archives"])
app.include_router(node_types.router, prefix=f"{settings.API_V1_STR}/node-types", tags=["node-types"])

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
