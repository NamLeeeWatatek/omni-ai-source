import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (googleApiKey) {
      this.genAI = new GoogleGenerativeAI(googleApiKey);
      this.logger.log('✅ Google AI initialized for chat');
    } else {
      this.logger.warn('⚠️ Google API key not found - AI chat disabled');
    }
  }

  getModels() {
    // Check which providers are available
    const hasGoogleAI = !!this.genAI;

    return [
      {
        id: 'text-embedding-004',
        name: 'Text Embedding 004',
        provider: 'google',
        type: 'embedding',
        is_available: hasGoogleAI,
        description: 'Google\'s text embedding model for vector search',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        type: 'chat',
        is_available: hasGoogleAI,
        description: 'Fast and efficient Gemini 2.5 model',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        type: 'chat',
        is_available: hasGoogleAI,
        description: 'Most capable Gemini 2.5 model with advanced reasoning',
      },
    ];
  }

  /**
   * Chat with AI using Google Gemini
   */
  async chat(message: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    if (!this.genAI) {
      return 'AI service is not available. Please configure GOOGLE_API_KEY.';
    }

    try {
      // Validate model name - use gemini-2.5-flash as default if invalid
      const validModels = [
        'gemini-2.5-flash',
        'gemini-2.5-pro'
      ];
      
      let modelToUse = validModels.includes(model) ? model : 'gemini-2.5-flash';
      
      // Try with specified model first, fallback to gemini-2.5-flash if fails
      this.logger.log(`Generating response with model: ${modelToUse}`);
      
      let aiModel = this.genAI.getGenerativeModel({ model: modelToUse });
      let result;
      
      try {
        result = await aiModel.generateContent(message);
      } catch (modelError) {
        // If model fails, try with fallback
        this.logger.warn(`Model ${modelToUse} failed, trying gemini-2.5-flash`);
        modelToUse = 'gemini-2.5-flash';
        aiModel = this.genAI.getGenerativeModel({ model: modelToUse });
        result = await aiModel.generateContent(message);
      }
      
      if (!result || !result.response) {
        throw new Error('No response from AI model');
      }
      
      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from AI model');
      }
      
      return text;
    } catch (error) {
      this.logger.error(`AI chat error: ${error.message}`, error.stack);
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        return 'Invalid API key. Please check your GOOGLE_API_KEY configuration.';
      } else if (error.message?.includes('quota')) {
        return 'API quota exceeded. Please try again later.';
      } else if (error.message?.includes('model')) {
        return 'Invalid model selected. Please choose a different model.';
      }
      
      return 'Sorry, I encountered an error processing your message. Please try again.';
    }
  }
}
