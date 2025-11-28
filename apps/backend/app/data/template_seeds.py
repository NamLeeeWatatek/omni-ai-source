"""
Template Seeds - Predefined workflow templates
These templates will be automatically loaded into the database on startup
"""

TEMPLATE_SEEDS = [
    {
        "name": "AI Chatbot",
        "description": "Simple AI chatbot using Gemini for customer support",
        "category": "customer-support",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-manual",
                    "config": {
                        "inputFields": [
                            {
                                "id": "message",
                                "label": "User Message",
                                "key": "message",
                                "type": "text",
                                "required": True
                            }
                        ]
                    }
                }
            },
            {
                "id": "ai-1",
                "type": "ai-gemini",
                "position": {"x": 350, "y": 100},
                "data": {
                    "label": "Gemini AI",
                    "type": "ai-gemini",
                    "config": {
                        "model": "gemini-pro",
                        "prompt": "You are a helpful customer support assistant. Answer the user's question: {{message}}"
                    }
                }
            },
            {
                "id": "response-1",
                "type": "response-text",
                "position": {"x": 600, "y": 100},
                "data": {
                    "label": "Send Response",
                    "type": "response-text",
                    "config": {
                        "message": "{{ai-1.output}}"
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "response-1"}
        ]
    },
    {
        "name": "Multi Platform Auto Poster",
        "description": "Generate content with AI and post to multiple social media platforms",
        "category": "social",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 150},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-manual",
                    "config": {
                        "inputFields": [
                            {
                                "id": "topic",
                                "label": "Content Topic",
                                "key": "topic",
                                "type": "text",
                                "required": True
                            }
                        ]
                    }
                }
            },
            {
                "id": "ai-1",
                "type": "ai-gemini",
                "position": {"x": 350, "y": 150},
                "data": {
                    "label": "Generate Content",
                    "type": "ai-gemini",
                    "config": {
                        "model": "gemini-pro",
                        "prompt": "Create an engaging social media post about: {{topic}}"
                    }
                }
            },
            {
                "id": "action-1",
                "type": "action-http",
                "position": {"x": 600, "y": 80},
                "data": {
                    "label": "Post to Facebook",
                    "type": "action-http",
                    "config": {
                        "method": "POST",
                        "url": "https://graph.facebook.com/v12.0/me/feed",
                        "body": {"message": "{{ai-1.output}}"}
                    }
                }
            },
            {
                "id": "action-2",
                "type": "action-http",
                "position": {"x": 600, "y": 220},
                "data": {
                    "label": "Post to Twitter",
                    "type": "action-http",
                    "config": {
                        "method": "POST",
                        "url": "https://api.twitter.com/2/tweets",
                        "body": {"text": "{{ai-1.output}}"}
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "action-1"},
            {"id": "e2-4", "source": "ai-1", "target": "action-2"}
        ]
    },
    {
        "name": "SEO Content to CMS",
        "description": "Generate SEO-optimized content and publish to WordPress CMS",
        "category": "content",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-manual",
                    "config": {
                        "inputFields": [
                            {
                                "id": "keyword",
                                "label": "SEO Keyword",
                                "key": "keyword",
                                "type": "text",
                                "required": True
                            }
                        ]
                    }
                }
            },
            {
                "id": "ai-1",
                "type": "ai-gemini",
                "position": {"x": 350, "y": 100},
                "data": {
                    "label": "Generate SEO Content",
                    "type": "ai-gemini",
                    "config": {
                        "model": "gemini-pro",
                        "prompt": "Write an SEO-optimized blog post about: {{keyword}}. Include title, meta description, and content."
                    }
                }
            },
            {
                "id": "action-1",
                "type": "action-http",
                "position": {"x": 600, "y": 100},
                "data": {
                    "label": "Publish to WordPress",
                    "type": "action-http",
                    "config": {
                        "method": "POST",
                        "url": "https://your-site.com/wp-json/wp/v2/posts",
                        "body": {
                            "title": "{{ai-1.output.title}}",
                            "content": "{{ai-1.output.content}}",
                            "status": "draft"
                        }
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "action-1"}
        ]
    },
    {
        "name": "Email Automation",
        "description": "Automated email responses with AI personalization",
        "category": "automation",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger-webhook",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Webhook Trigger",
                    "type": "trigger-webhook",
                    "config": {}
                }
            },
            {
                "id": "ai-1",
                "type": "ai-gemini",
                "position": {"x": 350, "y": 100},
                "data": {
                    "label": "Personalize Email",
                    "type": "ai-gemini",
                    "config": {
                        "model": "gemini-pro",
                        "prompt": "Create a personalized email response for: {{trigger-1.body}}"
                    }
                }
            },
            {
                "id": "action-1",
                "type": "action-email",
                "position": {"x": 600, "y": 100},
                "data": {
                    "label": "Send Email",
                    "type": "action-email",
                    "config": {
                        "to": "{{trigger-1.email}}",
                        "subject": "Re: {{trigger-1.subject}}",
                        "body": "{{ai-1.output}}"
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "action-1"}
        ]
    },
    {
        "name": "Lead Qualification Bot",
        "description": "AI-powered lead qualification and scoring",
        "category": "sales",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger-manual",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "New Lead",
                    "type": "trigger-manual",
                    "config": {
                        "inputFields": [
                            {
                                "id": "lead_info",
                                "label": "Lead Information",
                                "key": "lead_info",
                                "type": "json",
                                "required": True
                            }
                        ]
                    }
                }
            },
            {
                "id": "ai-1",
                "type": "ai-gemini",
                "position": {"x": 350, "y": 100},
                "data": {
                    "label": "Qualify Lead",
                    "type": "ai-gemini",
                    "config": {
                        "model": "gemini-pro",
                        "prompt": "Analyze this lead and provide a qualification score (1-10) and reasoning: {{lead_info}}"
                    }
                }
            },
            {
                "id": "logic-1",
                "type": "logic-condition",
                "position": {"x": 600, "y": 100},
                "data": {
                    "label": "Check Score",
                    "type": "logic-condition",
                    "config": {
                        "condition": "{{ai-1.score}} >= 7"
                    }
                }
            },
            {
                "id": "action-1",
                "type": "action-http",
                "position": {"x": 850, "y": 50},
                "data": {
                    "label": "Notify Sales Team",
                    "type": "action-http",
                    "config": {
                        "method": "POST",
                        "url": "https://your-crm.com/api/hot-leads"
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "logic-1"},
            {"id": "e3-4", "source": "logic-1", "target": "action-1", "label": "High Score"}
        ]
    }
]
