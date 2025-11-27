"""
Node Types API
Manage workflow node types
"""
from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from app.core.auth import get_current_user
from app.data.node_types import (
    get_all_node_types,
    get_node_type_by_id,
    get_node_types_by_category,
    get_node_categories
)

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_node_types(
    category: str = None,
    current_user: dict = Depends(get_current_user)
):
    """List all available node types"""
    if category:
        return get_node_types_by_category(category)
    return get_all_node_types()


@router.get("/categories", response_model=List[Dict[str, Any]])
async def list_node_categories(
    current_user: dict = Depends(get_current_user)
):
    """List all node categories"""
    return get_node_categories()


@router.get("/{node_id}", response_model=Dict[str, Any])
async def get_node_type(
    node_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific node type"""
    node_type = get_node_type_by_id(node_id)
    if not node_type:
        return {"error": "Node type not found"}
    return node_type
