"""
Template Seeder Service
Automatically loads predefined templates into the database
"""
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.template import WorkflowTemplate
from app.data.template_seeds import TEMPLATE_SEEDS
from datetime import datetime


async def seed_templates(session: AsyncSession, force_update: bool = False):
    """
    Seed templates into database
    
    Args:
        session: Database session
        force_update: If True, update existing templates. If False, only add new ones.
    """
    seeded_count = 0
    updated_count = 0
    
    for template_data in TEMPLATE_SEEDS:
        # Check if template already exists by name
        query = select(WorkflowTemplate).where(WorkflowTemplate.name == template_data["name"])
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            if force_update:
                # Update existing template
                existing.description = template_data.get("description")
                existing.category = template_data.get("category", "general")
                existing.nodes = template_data.get("nodes", [])
                existing.edges = template_data.get("edges", [])
                existing.updated_at = datetime.utcnow()
                updated_count += 1
                print(f"✓ Updated template: {template_data['name']}")
            else:
                print(f"⊘ Skipped existing template: {template_data['name']}")
        else:
            # Create new template
            template = WorkflowTemplate(
                name=template_data["name"],
                description=template_data.get("description"),
                category=template_data.get("category", "general"),
                nodes=template_data.get("nodes", []),
                edges=template_data.get("edges", [])
            )
            session.add(template)
            seeded_count += 1
            print(f"✓ Created template: {template_data['name']}")
    
    await session.commit()
    
    print(f"\n📦 Template Seeding Complete:")
    print(f"   - Created: {seeded_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {len(TEMPLATE_SEEDS)}")
    
    return {"created": seeded_count, "updated": updated_count, "total": len(TEMPLATE_SEEDS)}


async def clear_all_templates(session: AsyncSession):
    """Clear all templates from database (use with caution!)"""
    query = select(WorkflowTemplate)
    result = await session.execute(query)
    templates = result.scalars().all()
    
    for template in templates:
        await session.delete(template)
    
    await session.commit()
    print(f"🗑️  Cleared {len(templates)} templates")
    
    return len(templates)
