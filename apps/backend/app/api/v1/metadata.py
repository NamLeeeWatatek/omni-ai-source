"""
Metadata API - Tags, Categories, Icons management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime

from app.db.session import get_session
from app.models.metadata import Tag, Category, IconLibrary
from pydantic import BaseModel

router = APIRouter()


# ============= Pydantic Schemas =============
class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    description: Optional[str] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    color: str = "#6366f1"
    description: Optional[str] = None
    entity_type: str
    parent_id: Optional[int] = None
    order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    order: Optional[int] = None


class IconCreate(BaseModel):
    name: str
    library: str = "react-icons/fi"
    category: str = "general"
    tags: List[str] = []


class IconUpdate(BaseModel):
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None


# ============= TAGS ENDPOINTS =============
@router.get("/tags", response_model=List[Tag])
async def get_tags(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get all tags with optional search"""
    query = select(Tag)
    
    if search:
        query = query.where(Tag.name.contains(search))
    
    query = query.offset(skip).limit(limit).order_by(Tag.usage_count.desc(), Tag.name)
    tags = session.exec(query).all()
    return tags


@router.post("/tags", response_model=Tag)
async def create_tag(tag_data: TagCreate, session: Session = Depends(get_session)):
    """Create a new tag"""
    # Check if tag already exists
    existing = session.exec(select(Tag).where(Tag.name == tag_data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")
    
    tag = Tag(**tag_data.model_dump())
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.get("/tags/{tag_id}", response_model=Tag)
async def get_tag(tag_id: int, session: Session = Depends(get_session)):
    """Get a specific tag"""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.patch("/tags/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    session: Session = Depends(get_session)
):
    """Update a tag"""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    update_data = tag_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)
    
    tag.updated_at = datetime.utcnow()
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: int, session: Session = Depends(get_session)):
    """Delete a tag"""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    session.delete(tag)
    session.commit()
    return {"message": "Tag deleted successfully"}


# ============= CATEGORIES ENDPOINTS =============
@router.get("/categories", response_model=List[Category])
async def get_categories(
    entity_type: Optional[str] = None,
    parent_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all categories with optional filtering"""
    query = select(Category)
    
    if entity_type:
        query = query.where(Category.entity_type == entity_type)
    
    if parent_id is not None:
        query = query.where(Category.parent_id == parent_id)
    
    query = query.offset(skip).limit(limit).order_by(Category.order, Category.name)
    categories = session.exec(query).all()
    return categories


@router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    session: Session = Depends(get_session)
):
    """Create a new category"""
    # Check if slug already exists
    existing = session.exec(
        select(Category).where(Category.slug == category_data.slug)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    
    category = Category(**category_data.model_dump())
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: int, session: Session = Depends(get_session)):
    """Get a specific category"""
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.patch("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    session: Session = Depends(get_session)
):
    """Update a category"""
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.is_system:
        raise HTTPException(status_code=403, detail="Cannot modify system category")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    category.updated_at = datetime.utcnow()
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, session: Session = Depends(get_session)):
    """Delete a category"""
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.is_system:
        raise HTTPException(status_code=403, detail="Cannot delete system category")
    
    session.delete(category)
    session.commit()
    return {"message": "Category deleted successfully"}


# ============= ICONS ENDPOINTS =============
@router.get("/icons", response_model=List[IconLibrary])
async def get_icons(
    category: Optional[str] = None,
    search: Optional[str] = None,
    favorites_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all icons with optional filtering"""
    query = select(IconLibrary)
    
    if category:
        query = query.where(IconLibrary.category == category)
    
    if search:
        query = query.where(IconLibrary.name.contains(search))
    
    if favorites_only:
        query = query.where(IconLibrary.is_favorite == True)
    
    query = query.offset(skip).limit(limit).order_by(
        IconLibrary.is_favorite.desc(),
        IconLibrary.usage_count.desc(),
        IconLibrary.name
    )
    icons = session.exec(query).all()
    return icons


@router.post("/icons", response_model=IconLibrary)
async def create_icon(icon_data: IconCreate, session: Session = Depends(get_session)):
    """Create a new icon"""
    existing = session.exec(
        select(IconLibrary).where(IconLibrary.name == icon_data.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Icon with this name already exists")
    
    icon = IconLibrary(**icon_data.model_dump())
    session.add(icon)
    session.commit()
    session.refresh(icon)
    return icon


@router.patch("/icons/{icon_id}", response_model=IconLibrary)
async def update_icon(
    icon_id: int,
    icon_data: IconUpdate,
    session: Session = Depends(get_session)
):
    """Update an icon"""
    icon = session.get(IconLibrary, icon_id)
    if not icon:
        raise HTTPException(status_code=404, detail="Icon not found")
    
    update_data = icon_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(icon, key, value)
    
    session.add(icon)
    session.commit()
    session.refresh(icon)
    return icon


@router.delete("/icons/{icon_id}")
async def delete_icon(icon_id: int, session: Session = Depends(get_session)):
    """Delete an icon"""
    icon = session.get(IconLibrary, icon_id)
    if not icon:
        raise HTTPException(status_code=404, detail="Icon not found")
    
    session.delete(icon)
    session.commit()
    return {"message": "Icon deleted successfully"}


# ============= STATS ENDPOINTS =============
@router.get("/stats")
async def get_metadata_stats(session: Session = Depends(get_session)):
    """Get metadata statistics"""
    tags_count = session.exec(select(func.count(Tag.id))).one()
    categories_count = session.exec(select(func.count(Category.id))).one()
    icons_count = session.exec(select(func.count(IconLibrary.id))).one()
    
    return {
        "tags": tags_count,
        "categories": categories_count,
        "icons": icons_count
    }
