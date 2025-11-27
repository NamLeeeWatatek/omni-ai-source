"""
Workflow Templates - Using Only Existing Node Types
All templates use proper Omi nodes integrated with Channels system
"""

WORKFLOW_TEMPLATES = {
    # ============================================
    # Template 1: Simple AI Chatbot
    # ============================================
    "chatbot": {
        "name": "AI Chatbot",
        "description": "Simple AI chatbot using Gemini",
        "category": "ai",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 200},
                "data": {
                    "type": "trigger-manual",
                    "label": "Manual Trigger",
                    "config": {}
                }
            },
            {
                "id": "gemini_1",
                "type": "ai-gemini",
                "position": {"x": 400, "y": 200},
                "data": {
                    "type": "ai-gemini",
                    "label": "Gemini AI",
                    "config": {
                        "prompt": "{{trigger.message}}",
                        "model": "gemini-2.5-flash",
                        "temperature": 0.7
                    }
                }
            },
            {
                "id": "response_1",
                "type": "response-data",
                "position": {"x": 700, "y": 200},
                "data": {
                    "type": "response-data",
                    "label": "Return Response",
                    "config": {
                        "status": 200,
                        "body": '{"response": "{{gemini.text}}"}'
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "gemini_1", "type": "smoothstep"},
            {"id": "e2", "source": "gemini_1", "target": "response_1", "type": "smoothstep"}
        ]
    },

    # ============================================
    # Template 2: Multi-Platform Auto Poster
    # ============================================
    "auto_poster": {
        "name": "Multi-Platform Auto Poster",
        "description": "Generate content and post to multiple social platforms",
        "category": "social",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger-schedule",
                "position": {"x": 100, "y": 200},
                "data": {
                    "type": "trigger-schedule",
                    "label": "Daily at 9 AM",
                    "config": {
                        "schedule": "0 9 * * *",
                        "timezone": "Asia/Ho_Chi_Minh"
                    }
                }
            },
            {
                "id": "content_1",
                "type": "ai-content-writer",
                "position": {"x": 400, "y": 200},
                "data": {
                    "type": "ai-content-writer",
                    "label": "Generate Caption",
                    "config": {
                        "content_type": "caption",
                        "topic": "Daily motivation quote",
                        "tone": "friendly",
                        "length": "short"
                    }
                }
            },
            {
                "id": "social_1",
                "type": "action-post-social",
                "position": {"x": 700, "y": 200},
                "data": {
                    "type": "action-post-social",
                    "label": "Post to Social",
                    "config": {
                        "channel_ids": [],  # User selects channels in UI
                        "content": "{{content.text}}",
                        "media_url": ""
                    }
                }
            },
            {
                "id": "response_1",
                "type": "response-data",
                "position": {"x": 1000, "y": 200},
                "data": {
                    "type": "response-data",
                    "label": "Return Results",
                    "config": {
                        "status": 200,
                        "body": '{"status": "posted", "posts": "{{social.posts}}"}'
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "content_1", "type": "smoothstep"},
            {"id": "e2", "source": "content_1", "target": "social_1", "type": "smoothstep"},
            {"id": "e3", "source": "social_1", "target": "response_1", "type": "smoothstep"}
        ]
    },

    # ============================================
    # Template 3: Content to CMS
    # ============================================
    "content_to_cms": {
        "name": "SEO Content to CMS",
        "description": "Generate SEO content and publish to WordPress/CMS",
        "category": "content",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 200},
                "data": {
                    "type": "trigger-manual",
                    "label": "Manual Trigger",
                    "config": {}
                }
            },
            {
                "id": "content_1",
                "type": "ai-content-writer",
                "position": {"x": 400, "y": 200},
                "data": {
                    "type": "ai-content-writer",
                    "label": "Generate SEO Content",
                    "config": {
                        "content_type": "seo_content",
                        "topic": "{{trigger.topic}}",
                        "tone": "professional",
                        "length": "long"
                    }
                }
            },
            {
                "id": "transform_1",
                "type": "logic-transform",
                "position": {"x": 700, "y": 200},
                "data": {
                    "type": "logic-transform",
                    "label": "Format for CMS",
                    "config": {
                        "mappings": {
                            "title": "{{trigger.title}}",
                            "content": "{{content.text}}",
                            "status": "draft",
                            "author": "AI Writer"
                        }
                    }
                }
            },
            {
                "id": "http_1",
                "type": "action-http",
                "position": {"x": 1000, "y": 200},
                "data": {
                    "type": "action-http",
                    "label": "Publish to CMS",
                    "config": {
                        "url": "https://your-cms.com/wp-json/wp/v2/posts",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer YOUR_API_KEY"
                        },
                        "body": "{{transform}}"
                    }
                }
            },
            {
                "id": "response_1",
                "type": "response-data",
                "position": {"x": 1300, "y": 200},
                "data": {
                    "type": "response-data",
                    "label": "Return URL",
                    "config": {
                        "status": 201,
                        "body": '{"status": "published", "url": "{{http.link}}"}'
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "content_1", "type": "smoothstep"},
            {"id": "e2", "source": "content_1", "target": "transform_1", "type": "smoothstep"},
            {"id": "e3", "source": "transform_1", "target": "http_1", "type": "smoothstep"},
            {"id": "e4", "source": "http_1", "target": "response_1", "type": "smoothstep"}
        ]
    },


}


def get_all_templates():
    """Get all workflow templates"""
    return list(WORKFLOW_TEMPLATES.values())


def get_template_by_id(template_id: str):
    """Get specific template"""
    return WORKFLOW_TEMPLATES.get(template_id)


def get_templates_by_category(category: str):
    """Get templates by category"""
    return [t for t in WORKFLOW_TEMPLATES.values() if t.get("category") == category]
