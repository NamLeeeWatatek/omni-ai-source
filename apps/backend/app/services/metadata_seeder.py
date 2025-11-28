"""
Metadata Seeder - Seed initial tags, categories, and icons
"""
from sqlmodel import Session, select
from app.models.metadata import Tag, Category, IconLibrary


async def seed_metadata(session: Session, force_update: bool = False):
    """Seed initial metadata"""
    
    # Seed default categories
    default_categories = [
        # Workflow categories
        {"name": "Customer Service", "slug": "customer-service", "icon": "FiHeadphones", "color": "#3b82f6", "entity_type": "workflow", "is_system": True, "order": 1},
        {"name": "Sales & Marketing", "slug": "sales-marketing", "icon": "FiTrendingUp", "color": "#10b981", "entity_type": "workflow", "is_system": True, "order": 2},
        {"name": "E-commerce", "slug": "ecommerce", "icon": "FiShoppingCart", "color": "#f59e0b", "entity_type": "workflow", "is_system": True, "order": 3},
        {"name": "Automation", "slug": "automation", "icon": "FiZap", "color": "#8b5cf6", "entity_type": "workflow", "is_system": True, "order": 4},
        {"name": "Integration", "slug": "integration", "icon": "FiLink", "color": "#ec4899", "entity_type": "workflow", "is_system": True, "order": 5},
        {"name": "General", "slug": "general", "icon": "FiFolder", "color": "#6366f1", "entity_type": "workflow", "is_system": True, "order": 6},
        
        # Template categories
        {"name": "Quick Start", "slug": "quick-start", "icon": "FiPlay", "color": "#06b6d4", "entity_type": "template", "is_system": True, "order": 1},
        {"name": "Advanced", "slug": "advanced", "icon": "FiCpu", "color": "#ef4444", "entity_type": "template", "is_system": True, "order": 2},
        
        # Bot categories
        {"name": "Support Bot", "slug": "support-bot", "icon": "FiMessageCircle", "color": "#3b82f6", "entity_type": "bot", "is_system": True, "order": 1},
        {"name": "Sales Bot", "slug": "sales-bot", "icon": "FiDollarSign", "color": "#10b981", "entity_type": "bot", "is_system": True, "order": 2},
    ]
    
    for cat_data in default_categories:
        existing = session.exec(
            select(Category).where(Category.slug == cat_data["slug"])
        ).first()
        
        if not existing:
            category = Category(**cat_data)
            session.add(category)
            print(f"✅ Created category: {cat_data['name']}")
        elif force_update:
            for key, value in cat_data.items():
                setattr(existing, key, value)
            session.add(existing)
            print(f"🔄 Updated category: {cat_data['name']}")
    
    # Seed default tags
    default_tags = [
        {"name": "Popular", "color": "#f59e0b", "description": "Popular workflows"},
        {"name": "New", "color": "#10b981", "description": "Newly added"},
        {"name": "Featured", "color": "#8b5cf6", "description": "Featured content"},
        {"name": "AI-Powered", "color": "#3b82f6", "description": "Uses AI capabilities"},
        {"name": "Quick Setup", "color": "#06b6d4", "description": "Easy to set up"},
        {"name": "Advanced", "color": "#ef4444", "description": "Advanced features"},
        {"name": "Beginner Friendly", "color": "#10b981", "description": "Good for beginners"},
        {"name": "Multi-Channel", "color": "#ec4899", "description": "Works across channels"},
    ]
    
    for tag_data in default_tags:
        existing = session.exec(
            select(Tag).where(Tag.name == tag_data["name"])
        ).first()
        
        if not existing:
            tag = Tag(**tag_data)
            session.add(tag)
            print(f"✅ Created tag: {tag_data['name']}")
    
    # Seed popular icons
    popular_icons = [
        # General
        {"name": "FiZap", "library": "react-icons/fi", "category": "general", "tags": ["lightning", "fast", "power"]},
        {"name": "FiStar", "library": "react-icons/fi", "category": "general", "tags": ["favorite", "rating"]},
        {"name": "FiHeart", "library": "react-icons/fi", "category": "general", "tags": ["like", "love"]},
        {"name": "FiFolder", "library": "react-icons/fi", "category": "general", "tags": ["directory", "files"]},
        {"name": "FiFile", "library": "react-icons/fi", "category": "general", "tags": ["document"]},
        
        # Communication
        {"name": "FiMessageCircle", "library": "react-icons/fi", "category": "communication", "tags": ["chat", "message"]},
        {"name": "FiMail", "library": "react-icons/fi", "category": "communication", "tags": ["email"]},
        {"name": "FiPhone", "library": "react-icons/fi", "category": "communication", "tags": ["call", "telephone"]},
        {"name": "FiHeadphones", "library": "react-icons/fi", "category": "communication", "tags": ["support", "audio"]},
        
        # Business
        {"name": "FiShoppingCart", "library": "react-icons/fi", "category": "business", "tags": ["ecommerce", "shop"]},
        {"name": "FiDollarSign", "library": "react-icons/fi", "category": "business", "tags": ["money", "price"]},
        {"name": "FiTrendingUp", "library": "react-icons/fi", "category": "business", "tags": ["growth", "analytics"]},
        {"name": "FiBarChart", "library": "react-icons/fi", "category": "business", "tags": ["stats", "chart"]},
        
        # Tech
        {"name": "FiCpu", "library": "react-icons/fi", "category": "tech", "tags": ["processor", "computing"]},
        {"name": "FiDatabase", "library": "react-icons/fi", "category": "tech", "tags": ["data", "storage"]},
        {"name": "FiServer", "library": "react-icons/fi", "category": "tech", "tags": ["hosting", "backend"]},
        {"name": "FiCode", "library": "react-icons/fi", "category": "tech", "tags": ["programming", "developer"]},
        
        # Social
        {"name": "FiFacebook", "library": "react-icons/fi", "category": "social", "tags": ["facebook", "social media"]},
        {"name": "FiInstagram", "library": "react-icons/fi", "category": "social", "tags": ["instagram", "social media"]},
        {"name": "FiTwitter", "library": "react-icons/fi", "category": "social", "tags": ["twitter", "social media"]},
    ]
    
    for icon_data in popular_icons:
        existing = session.exec(
            select(IconLibrary).where(IconLibrary.name == icon_data["name"])
        ).first()
        
        if not existing:
            icon = IconLibrary(**icon_data)
            session.add(icon)
            print(f"✅ Created icon: {icon_data['name']}")
    
    session.commit()
    print("✅ Metadata seeding completed!")
