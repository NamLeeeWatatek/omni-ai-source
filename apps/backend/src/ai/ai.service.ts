import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
    getModels() {
        return [
            {
                id: 'gpt-4',
                name: 'GPT-4',
                provider: 'openai',
                type: 'chat',
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                type: 'chat',
            },
            {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                type: 'chat',
            },
            {
                id: 'claude-3-sonnet',
                name: 'Claude 3 Sonnet',
                provider: 'anthropic',
                type: 'chat',
            },
            {
                id: 'gemini-pro',
                name: 'Gemini Pro',
                provider: 'google',
                type: 'chat',
            },
        ];
    }
}
