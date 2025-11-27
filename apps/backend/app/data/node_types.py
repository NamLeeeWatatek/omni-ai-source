"""
Node Types Configuration - Final Version
12 core functional nodes integrated with Channels system
"""

NODE_TYPES = {
    # ============================================
    # TRIGGERS (2 nodes) - Start workflows
    # ============================================
    "trigger-manual": {
        "id": "trigger-manual",
        "label": "Manual Trigger",
        "category": "trigger",
        "icon": "FiPlay",
        "color": "#10b981",
        "description": "Start workflow manually by clicking Run button",
        "properties": []  # No configuration needed
    },
    
    "trigger-schedule": {
        "id": "trigger-schedule",
        "label": "Schedule",
        "category": "trigger",
        "icon": "FiClock",
        "color": "#3b82f6",
        "description": "Run workflow on schedule (cron)",
        "properties": [
            {
                "name": "schedule",
                "label": "Schedule (Cron Expression)",
                "type": "text",
                "required": True,
                "default": "0 9 * * *",
                "placeholder": "0 9 * * *",
                "description": "Cron expression. Example: '0 9 * * *' = Daily at 9 AM"
            },
            {
                "name": "timezone",
                "label": "Timezone",
                "type": "select",
                "required": False,
                "default": "Asia/Ho_Chi_Minh",
                "options": [
                    {"value": "Asia/Ho_Chi_Minh", "label": "Asia/Ho Chi Minh (GMT+7)"},
                    {"value": "UTC", "label": "UTC (GMT+0)"},
                    {"value": "America/New_York", "label": "America/New York (EST)"},
                    {"value": "Europe/London", "label": "Europe/London (GMT)"}
                ],
                "description": "Timezone for schedule execution"
            }
        ]
    },

    # ============================================
    # AI (4 nodes) - AI operations
    # ============================================
    "ai-gemini": {
        "id": "ai-gemini",
        "label": "Gemini",
        "category": "ai",
        "icon": "SiGoogle",
        "color": "#4285f4",
        "description": "Call Google Gemini API for AI responses",
        "properties": [
            {
                "name": "prompt",
                "label": "Prompt",
                "type": "textarea",
                "required": True,
                "placeholder": "Enter your prompt. Use {{trigger.input}} for dynamic values",
                "description": "Prompt to send to Gemini. Supports {{variable}} syntax"
            },
            {
                "name": "model",
                "label": "Model",
                "type": "select",
                "required": False,
                "default": "gemini-2.5-flash",
                "options": "dynamic:ai-models:gemini",  # Load from /api/v1/ai/models
                "description": "Gemini model to use"
            },
            {
                "name": "temperature",
                "label": "Temperature",
                "type": "number",
                "required": False,
                "default": 0.7,
                "placeholder": "0.7",
                "description": "Controls randomness (0.0 = focused, 1.0 = creative)"
            }
        ]
    },
    
    "ai-openai": {
        "id": "ai-openai",
        "label": "OpenAI",
        "category": "ai",
        "icon": "SiOpenai",
        "color": "#10a37f",
        "description": "Call OpenAI API (GPT-4, GPT-3.5)",
        "properties": [
            {
                "name": "prompt",
                "label": "Prompt",
                "type": "textarea",
                "required": True,
                "placeholder": "Enter your prompt",
                "description": "Prompt to send to OpenAI"
            },
            {
                "name": "model",
                "label": "Model",
                "type": "select",
                "required": False,
                "default": "gpt-4o",
                "options": "dynamic:ai-models:openai",  # Load from /api/v1/ai/models
                "description": "OpenAI model to use"
            },
            {
                "name": "temperature",
                "label": "Temperature",
                "type": "number",
                "required": False,
                "default": 0.7,
                "description": "Controls randomness (0.0 = focused, 1.0 = creative)"
            },
            {
                "name": "max_tokens",
                "label": "Max Tokens",
                "type": "number",
                "required": False,
                "default": 150,
                "description": "Maximum length of response"
            }
        ]
    },
    
    "ai-classify": {
        "id": "ai-classify",
        "label": "Classify Text",
        "category": "ai",
        "icon": "MdSmartToy",
        "color": "#ec4899",
        "description": "Classify text into categories using AI",
        "properties": [
            {
                "name": "text",
                "label": "Text to Classify",
                "type": "textarea",
                "required": True,
                "placeholder": "{{trigger.input}}",
                "description": "Text to classify"
            },
            {
                "name": "categories",
                "label": "Categories (comma-separated)",
                "type": "text",
                "required": True,
                "placeholder": "support, sales, feedback, complaint",
                "description": "List of categories separated by commas"
            }
        ]
    },
    
    "ai-content-writer": {
        "id": "ai-content-writer",
        "label": "Content Writer",
        "category": "ai",
        "icon": "MdArticle",
        "color": "#f59e0b",
        "description": "Generate captions, ad copy, and content with AI",
        "properties": [
            {
                "name": "content_type",
                "label": "Content Type",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "caption", "label": "Social Media Caption"},
                    {"value": "ad_copy", "label": "Advertisement Copy"},
                    {"value": "blog_post", "label": "Blog Post"},
                    {"value": "seo_content", "label": "SEO Content"}
                ],
                "description": "Type of content to generate"
            },
            {
                "name": "topic",
                "label": "Topic/Product",
                "type": "text",
                "required": True,
                "placeholder": "e.g., New smartphone launch",
                "description": "What is the content about?"
            },
            {
                "name": "tone",
                "label": "Tone",
                "type": "select",
                "required": False,
                "default": "professional",
                "options": [
                    {"value": "professional", "label": "Professional"},
                    {"value": "casual", "label": "Casual"},
                    {"value": "friendly", "label": "Friendly"},
                    {"value": "formal", "label": "Formal"},
                    {"value": "humorous", "label": "Humorous"}
                ],
                "description": "Writing tone"
            },
            {
                "name": "length",
                "label": "Length",
                "type": "select",
                "required": False,
                "default": "medium",
                "options": [
                    {"value": "short", "label": "Short (50-100 words)"},
                    {"value": "medium", "label": "Medium (100-300 words)"},
                    {"value": "long", "label": "Long (300+ words)"}
                ],
                "description": "Content length"
            }
        ]
    },

    # ============================================
    # ACTIONS (5 nodes) - Do something
    # ============================================
    "action-http": {
        "id": "action-http",
        "label": "HTTP Request",
        "category": "action",
        "icon": "FiSend",
        "color": "#6366f1",
        "description": "Make HTTP API request (GET, POST, PUT, DELETE)",
        "properties": [
            {
                "name": "url",
                "label": "URL",
                "type": "text",
                "required": True,
                "placeholder": "https://api.example.com/endpoint",
                "description": "API endpoint URL"
            },
            {
                "name": "method",
                "label": "Method",
                "type": "select",
                "required": True,
                "default": "POST",
                "options": [
                    {"value": "GET", "label": "GET"},
                    {"value": "POST", "label": "POST"},
                    {"value": "PUT", "label": "PUT"},
                    {"value": "DELETE", "label": "DELETE"},
                    {"value": "PATCH", "label": "PATCH"}
                ],
                "description": "HTTP method"
            },
            {
                "name": "headers",
                "label": "Headers",
                "type": "key-value",
                "required": False,
                "placeholder": {"key": "Content-Type", "value": "application/json"},
                "description": "Request headers"
            },
            {
                "name": "body",
                "label": "Request Body (JSON)",
                "type": "json",
                "required": False,
                "description": "Request body in JSON format. Use {{variable}} for dynamic values"
            }
        ]
    },
    
    "action-code": {
        "id": "action-code",
        "label": "Run Code",
        "category": "action",
        "icon": "FiCode",
        "color": "#64748b",
        "description": "Execute custom JavaScript code",
        "properties": [
            {
                "name": "code",
                "label": "JavaScript Code",
                "type": "textarea",
                "required": True,
                "placeholder": "// Access input via 'input' variable\nconst result = input.value * 2;\nreturn { result };",
                "description": "JavaScript code. Use 'input' to access previous node data, 'return' to output data"
            }
        ]
    },
    
    "action-send-message": {
        "id": "action-send-message",
        "label": "Send Message",
        "category": "action",
        "icon": "FiMessageCircle",
        "color": "#0084FF",
        "description": "Send message via WhatsApp, Telegram, Messenger, etc.",
        "properties": [
            {
                "name": "channel_ids",
                "label": "Select Channels",
                "type": "multi-select",
                "required": True,
                "options": "dynamic:channels",  # Fetched from /api/v1/channels
                "description": "Select messaging channels (WhatsApp, Telegram, etc.)"
            },
            {
                "name": "recipient",
                "label": "Recipient",
                "type": "text",
                "required": True,
                "placeholder": "+84901234567 or user@example.com",
                "description": "Phone number, email, or user ID"
            },
            {
                "name": "message",
                "label": "Message",
                "type": "textarea",
                "required": True,
                "placeholder": "Your message. Use {{variable}} for dynamic content",
                "description": "Message content"
            }
        ]
    },
    
    "action-post-social": {
        "id": "action-post-social",
        "label": "Post to Social Media",
        "category": "action",
        "icon": "FiShare2",
        "color": "#1877F2",
        "description": "Post to Facebook, Instagram, TikTok, etc. (multi-platform)",
        "properties": [
            {
                "name": "channel_ids",
                "label": "Select Social Channels",
                "type": "multi-select",
                "required": True,
                "options": "dynamic:channels",  # Fetched from /api/v1/channels (filtered by type=social)
                "description": "Select one or more social media channels to post to"
            },
            {
                "name": "content",
                "label": "Post Content",
                "type": "textarea",
                "required": True,
                "placeholder": "Post caption or description",
                "description": "Text content for the post"
            },
            {
                "name": "media_url",
                "label": "Media URL (optional)",
                "type": "text",
                "required": False,
                "placeholder": "https://example.com/image.jpg",
                "description": "URL of image or video to post"
            }
        ]
    },
    
    "action-upload-image": {
        "id": "action-upload-image",
        "label": "Upload Image",
        "category": "action",
        "icon": "FiImage",
        "color": "#10b981",
        "description": "Upload image(s) to Cloudinary",
        "properties": [
            {
                "name": "images",
                "label": "Images",
                "type": "file",
                "required": True,
                "accept": "image/*",
                "multiple": True,
                "description": "Select one or more images"
            },
            {
                "name": "folder",
                "label": "Folder",
                "type": "text",
                "required": False,
                "default": "wataomi/images",
                "placeholder": "wataomi/images",
                "description": "Cloudinary folder path"
            }
        ]
    },
    
    "action-upload-video": {
        "id": "action-upload-video",
        "label": "Upload Video",
        "category": "action",
        "icon": "FiVideo",
        "color": "#8b5cf6",
        "description": "Upload video(s) to Cloudinary",
        "properties": [
            {
                "name": "videos",
                "label": "Videos",
                "type": "file",
                "required": True,
                "accept": "video/*",
                "multiple": True,
                "description": "Select one or more videos"
            },
            {
                "name": "folder",
                "label": "Folder",
                "type": "text",
                "required": False,
                "default": "wataomi/videos",
                "placeholder": "wataomi/videos",
                "description": "Cloudinary folder path"
            }
        ]
    },

    # ============================================
    # LOGIC (2 nodes) - Control flow
    # ============================================
    "logic-condition": {
        "id": "logic-condition",
        "label": "Condition",
        "category": "logic",
        "icon": "FiGitBranch",
        "color": "#f59e0b",
        "description": "Branch workflow based on condition (if/else)",
        "properties": [
            {
                "name": "condition_type",
                "label": "Condition Type",
                "type": "select",
                "required": True,
                "default": "equals",
                "options": [
                    {"value": "equals", "label": "Equals (==)"},
                    {"value": "not_equals", "label": "Not Equals (!=)"},
                    {"value": "contains", "label": "Contains"},
                    {"value": "greater_than", "label": "Greater Than (>)"},
                    {"value": "less_than", "label": "Less Than (<)"},
                    {"value": "is_empty", "label": "Is Empty"},
                    {"value": "is_not_empty", "label": "Is Not Empty"}
                ],
                "description": "Type of comparison"
            },
            {
                "name": "value1",
                "label": "Value 1",
                "type": "text",
                "required": True,
                "placeholder": "{{trigger.status}}",
                "description": "First value to compare"
            },
            {
                "name": "value2",
                "label": "Value 2",
                "type": "text",
                "required": False,
                "placeholder": "active",
                "description": "Second value (not needed for is_empty/is_not_empty)"
            }
        ]
    },
    
    "logic-transform": {
        "id": "logic-transform",
        "label": "Transform Data",
        "category": "logic",
        "icon": "MdTransform",
        "color": "#14b8a6",
        "description": "Transform and map data structure",
        "properties": [
            {
                "name": "mappings",
                "label": "Field Mappings",
                "type": "key-value",
                "required": True,
                "placeholder": {"key": "output_field", "value": "{{input.field}}"},
                "description": "Map input fields to output fields. Use {{variable}} syntax"
            }
        ]
    },

    # ============================================
    # RESPONSE (1 node) - End workflow
    # ============================================
    "response-data": {
        "id": "response-data",
        "label": "Return Data",
        "category": "response",
        "icon": "FiCornerUpLeft",
        "color": "#10b981",
        "description": "Return final workflow result",
        "properties": [
            {
                "name": "status",
                "label": "Status Code",
                "type": "select",
                "required": True,
                "default": 200,
                "options": [
                    {"value": 200, "label": "200 - Success"},
                    {"value": 201, "label": "201 - Created"},
                    {"value": 400, "label": "400 - Bad Request"},
                    {"value": 404, "label": "404 - Not Found"},
                    {"value": 500, "label": "500 - Server Error"}
                ],
                "description": "Response status code"
            },
            {
                "name": "body",
                "label": "Response Body (JSON)",
                "type": "json",
                "required": False,
                "default": '{"status": "success", "data": "{{ai.response}}"}',
                "placeholder": '{"status": "success"}',
                "description": "Response body. Use {{variable}} for dynamic values"
            }
        ]
    }
}

# Streamlined categories: 5 categories
NODE_CATEGORIES = [
    {"id": "trigger", "label": "Triggers", "color": "#10b981"},
    {"id": "ai", "label": "AI", "color": "#a855f7"},
    {"id": "action", "label": "Actions", "color": "#6366f1"},
    {"id": "logic", "label": "Logic", "color": "#f59e0b"},
    {"id": "response", "label": "Response", "color": "#10b981"}
]


def get_all_node_types():
    """Get all node types"""
    return list(NODE_TYPES.values())


def get_node_type_by_id(node_id: str):
    """Get specific node type"""
    return NODE_TYPES.get(node_id)


def get_node_types_by_category(category: str):
    """Get node types by category"""
    return [node for node in NODE_TYPES.values() if node["category"] == category]


def get_node_categories():
    """Get all categories"""
    return NODE_CATEGORIES
