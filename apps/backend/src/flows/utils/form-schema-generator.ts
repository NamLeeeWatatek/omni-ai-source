/**
 * Form Schema Generator
 * Automatically generates formSchema for flows based on their nodes
 * This allows any flow to be used in UGC Factory with a user-friendly UI
 */

export interface FormField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'date'
    | 'email'
    | 'url';
  label: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  rows?: number;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface FormStep {
  id: string;
  label: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  steps: FormStep[];
}

/**
 * Predefined form schemas for common flow types
 */
export const FORM_SCHEMA_TEMPLATES = {
  // AI Image Generation
  'ai-image-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Image Details',
        description: 'Describe the image you want to generate',
        fields: [
          {
            id: 'prompt',
            type: 'textarea' as const,
            label: 'Image Prompt',
            placeholder: 'Describe the image you want to create...',
            required: true,
            rows: 4,
            helperText: 'Be specific and detailed for best results',
          },
          {
            id: 'style',
            type: 'select' as const,
            label: 'Art Style',
            required: true,
            options: [
              { value: 'realistic', label: 'Realistic' },
              { value: 'anime', label: 'Anime' },
              { value: 'cartoon', label: 'Cartoon' },
              { value: 'oil-painting', label: 'Oil Painting' },
              { value: 'watercolor', label: 'Watercolor' },
              { value: '3d-render', label: '3D Render' },
              { value: 'digital-art', label: 'Digital Art' },
              { value: 'sketch', label: 'Sketch' },
            ],
            defaultValue: 'realistic',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Image Settings',
        description: 'Configure image generation settings',
        fields: [
          {
            id: 'size',
            type: 'select' as const,
            label: 'Image Size',
            required: true,
            options: [
              { value: '512x512', label: 'Square (512x512)' },
              { value: '768x512', label: 'Landscape (768x512)' },
              { value: '512x768', label: 'Portrait (512x768)' },
              { value: '1024x1024', label: 'Large Square (1024x1024)' },
            ],
            defaultValue: '512x512',
          },
          {
            id: 'quality',
            type: 'select' as const,
            label: 'Quality',
            required: true,
            options: [
              { value: 'draft', label: 'Draft (Fast)' },
              { value: 'standard', label: 'Standard' },
              { value: 'hd', label: 'HD (Slow)' },
            ],
            defaultValue: 'standard',
          },
          {
            id: 'num_images',
            type: 'number' as const,
            label: 'Number of Images',
            required: true,
            min: 1,
            max: 4,
            defaultValue: 1,
            helperText: 'Generate 1-4 variations',
          },
        ],
      },
      {
        id: 'step-3',
        label: 'Advanced Options',
        description: 'Fine-tune your generation (optional)',
        fields: [
          {
            id: 'negative_prompt',
            type: 'textarea' as const,
            label: 'Negative Prompt',
            placeholder: 'What to avoid in the image...',
            required: false,
            rows: 3,
            helperText: "Describe what you DON'T want to see",
          },
          {
            id: 'seed',
            type: 'number' as const,
            label: 'Seed (Optional)',
            required: false,
            placeholder: 'Leave empty for random',
            helperText: 'Use same seed for reproducible results',
          },
        ],
      },
    ],
  },

  // AI Text Generation
  'ai-text-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Content Type',
        description: 'What type of content do you want to generate?',
        fields: [
          {
            id: 'content_type',
            type: 'select' as const,
            label: 'Content Type',
            required: true,
            options: [
              { value: 'blog-post', label: 'Blog Post' },
              { value: 'social-media', label: 'Social Media Post' },
              { value: 'email', label: 'Email' },
              { value: 'product-description', label: 'Product Description' },
              { value: 'ad-copy', label: 'Ad Copy' },
              { value: 'custom', label: 'Custom' },
            ],
            defaultValue: 'blog-post',
          },
          {
            id: 'topic',
            type: 'text' as const,
            label: 'Topic',
            placeholder: 'What is the main topic?',
            required: true,
            helperText: 'Be specific about your topic',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Content Details',
        description: 'Provide more details about your content',
        fields: [
          {
            id: 'tone',
            type: 'select' as const,
            label: 'Tone',
            required: true,
            options: [
              { value: 'professional', label: 'Professional' },
              { value: 'casual', label: 'Casual' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'formal', label: 'Formal' },
              { value: 'humorous', label: 'Humorous' },
              { value: 'persuasive', label: 'Persuasive' },
            ],
            defaultValue: 'professional',
          },
          {
            id: 'length',
            type: 'select' as const,
            label: 'Length',
            required: true,
            options: [
              { value: 'short', label: 'Short (100-300 words)' },
              { value: 'medium', label: 'Medium (300-600 words)' },
              { value: 'long', label: 'Long (600-1000 words)' },
            ],
            defaultValue: 'medium',
          },
          {
            id: 'keywords',
            type: 'text' as const,
            label: 'Keywords (Optional)',
            placeholder: 'keyword1, keyword2, keyword3',
            required: false,
            helperText: 'Comma-separated keywords to include',
          },
        ],
      },
      {
        id: 'step-3',
        label: 'Additional Context',
        description: 'Any additional information?',
        fields: [
          {
            id: 'context',
            type: 'textarea' as const,
            label: 'Additional Context',
            placeholder: 'Provide any additional context or requirements...',
            required: false,
            rows: 4,
          },
        ],
      },
    ],
  },

  // AI Video Generator
  'ai-video-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Video Concept',
        description: 'Describe your video concept',
        fields: [
          {
            id: 'script',
            type: 'textarea' as const,
            label: 'Video Script',
            placeholder: 'Describe what should happen in the video...',
            required: true,
            rows: 6,
            helperText: 'Describe scenes, actions, and visuals',
          },
          {
            id: 'duration',
            type: 'select' as const,
            label: 'Video Duration',
            required: true,
            options: [
              { value: '5', label: '5 seconds' },
              { value: '10', label: '10 seconds' },
              { value: '15', label: '15 seconds' },
              { value: '30', label: '30 seconds' },
            ],
            defaultValue: '10',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Video Style',
        description: 'Choose video style and settings',
        fields: [
          {
            id: 'style',
            type: 'select' as const,
            label: 'Video Style',
            required: true,
            options: [
              { value: 'realistic', label: 'Realistic' },
              { value: 'animated', label: 'Animated' },
              { value: 'cinematic', label: 'Cinematic' },
              { value: 'cartoon', label: 'Cartoon' },
            ],
            defaultValue: 'realistic',
          },
          {
            id: 'resolution',
            type: 'select' as const,
            label: 'Resolution',
            required: true,
            options: [
              { value: '720p', label: '720p (HD)' },
              { value: '1080p', label: '1080p (Full HD)' },
              { value: '4k', label: '4K (Ultra HD)' },
            ],
            defaultValue: '1080p',
          },
        ],
      },
    ],
  },

  // Social Media Post Generator
  'social-media-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Platform & Content',
        description: 'Choose platform and content type',
        fields: [
          {
            id: 'platform',
            type: 'select' as const,
            label: 'Platform',
            required: true,
            options: [
              { value: 'facebook', label: 'Facebook' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'twitter', label: 'Twitter/X' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'tiktok', label: 'TikTok' },
            ],
            defaultValue: 'instagram',
          },
          {
            id: 'post_type',
            type: 'select' as const,
            label: 'Post Type',
            required: true,
            options: [
              { value: 'promotional', label: 'Promotional' },
              { value: 'educational', label: 'Educational' },
              { value: 'entertaining', label: 'Entertaining' },
              { value: 'announcement', label: 'Announcement' },
            ],
            defaultValue: 'promotional',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Post Details',
        description: 'Provide post details',
        fields: [
          {
            id: 'topic',
            type: 'text' as const,
            label: 'Topic',
            placeholder: 'What is your post about?',
            required: true,
          },
          {
            id: 'caption',
            type: 'textarea' as const,
            label: 'Caption Ideas',
            placeholder: 'Provide some ideas for the caption...',
            required: false,
            rows: 3,
          },
          {
            id: 'hashtags',
            type: 'text' as const,
            label: 'Hashtags',
            placeholder: '#hashtag1 #hashtag2',
            required: false,
            helperText: 'Space-separated hashtags',
          },
        ],
      },
    ],
  },

  // Email Campaign Generator
  'email-campaign-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Campaign Type',
        description: 'What type of email campaign?',
        fields: [
          {
            id: 'campaign_type',
            type: 'select' as const,
            label: 'Campaign Type',
            required: true,
            options: [
              { value: 'newsletter', label: 'Newsletter' },
              { value: 'promotional', label: 'Promotional' },
              { value: 'welcome', label: 'Welcome Series' },
              { value: 'abandoned-cart', label: 'Abandoned Cart' },
              { value: 'announcement', label: 'Announcement' },
            ],
            defaultValue: 'newsletter',
          },
          {
            id: 'subject',
            type: 'text' as const,
            label: 'Subject Line',
            placeholder: 'Email subject line...',
            required: true,
            helperText: 'Keep it short and compelling',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Email Content',
        description: 'Provide email content details',
        fields: [
          {
            id: 'main_message',
            type: 'textarea' as const,
            label: 'Main Message',
            placeholder: 'What is the main message of your email?',
            required: true,
            rows: 4,
          },
          {
            id: 'cta',
            type: 'text' as const,
            label: 'Call-to-Action',
            placeholder: 'e.g., Shop Now, Learn More, Sign Up',
            required: true,
          },
          {
            id: 'tone',
            type: 'select' as const,
            label: 'Tone',
            required: true,
            options: [
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'casual', label: 'Casual' },
            ],
            defaultValue: 'friendly',
          },
        ],
      },
    ],
  },

  // Product Description Generator
  'product-description-generator': {
    steps: [
      {
        id: 'step-1',
        label: 'Product Information',
        description: 'Tell us about your product',
        fields: [
          {
            id: 'product_name',
            type: 'text' as const,
            label: 'Product Name',
            placeholder: 'Enter product name',
            required: true,
          },
          {
            id: 'category',
            type: 'select' as const,
            label: 'Category',
            required: true,
            options: [
              { value: 'electronics', label: 'Electronics' },
              { value: 'fashion', label: 'Fashion' },
              { value: 'home', label: 'Home & Garden' },
              { value: 'beauty', label: 'Beauty & Personal Care' },
              { value: 'sports', label: 'Sports & Outdoors' },
              { value: 'other', label: 'Other' },
            ],
            defaultValue: 'electronics',
          },
        ],
      },
      {
        id: 'step-2',
        label: 'Product Details',
        description: 'Provide product details',
        fields: [
          {
            id: 'features',
            type: 'textarea' as const,
            label: 'Key Features',
            placeholder: 'List the main features of your product...',
            required: true,
            rows: 4,
            helperText: 'One feature per line',
          },
          {
            id: 'target_audience',
            type: 'text' as const,
            label: 'Target Audience',
            placeholder: 'Who is this product for?',
            required: false,
          },
          {
            id: 'description_length',
            type: 'select' as const,
            label: 'Description Length',
            required: true,
            options: [
              { value: 'short', label: 'Short (50-100 words)' },
              { value: 'medium', label: 'Medium (100-200 words)' },
              { value: 'long', label: 'Long (200-300 words)' },
            ],
            defaultValue: 'medium',
          },
        ],
      },
    ],
  },
};

/**
 * Generate formSchema from flow nodes automatically
 */
export function generateFormSchemaFromNodes(nodes: any[]): FormSchema | null {
  // Detect flow type from nodes
  const flowType = detectFlowType(nodes);

  if (flowType && FORM_SCHEMA_TEMPLATES[flowType]) {
    return FORM_SCHEMA_TEMPLATES[flowType];
  }

  // If no template matches, return null (flow doesn't support UGC Factory UI)
  return null;
}

/**
 * Detect flow type from nodes
 */
function detectFlowType(
  nodes: any[],
): keyof typeof FORM_SCHEMA_TEMPLATES | null {
  const nodeTypes = nodes.map((n) => n.type?.toLowerCase() || '');
  const nodeLabels = nodes.map((n) => n.data?.label?.toLowerCase() || '');

  const allText = [...nodeTypes, ...nodeLabels].join(' ');

  // AI Image Generation
  if (
    allText.includes('image') &&
    (allText.includes('generate') || allText.includes('ai'))
  ) {
    return 'ai-image-generator';
  }

  // AI Text Generation
  if (
    allText.includes('text') &&
    (allText.includes('generate') ||
      allText.includes('ai') ||
      allText.includes('gpt'))
  ) {
    return 'ai-text-generator';
  }

  // Video Generation
  if (allText.includes('video') && allText.includes('generate')) {
    return 'ai-video-generator';
  }

  // Social Media
  if (
    allText.includes('social') ||
    allText.includes('instagram') ||
    allText.includes('facebook')
  ) {
    return 'social-media-generator';
  }

  // Email Campaign
  if (
    allText.includes('email') &&
    (allText.includes('campaign') || allText.includes('newsletter'))
  ) {
    return 'email-campaign-generator';
  }

  // Product Description
  if (allText.includes('product') && allText.includes('description')) {
    return 'product-description-generator';
  }

  return null;
}
