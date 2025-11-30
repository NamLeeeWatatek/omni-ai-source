import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeExecutor, NodeExecutionInput, NodeExecutionOutput } from '../node-executor.interface';
import OpenAI from 'openai';

@Injectable()
export class AIChatExecutor implements NodeExecutor {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
    }

    async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
        if (!this.openai) {
            // Try to initialize again if key was added later (or just fail)
            const apiKey = this.configService.get<string>('OPENAI_API_KEY');
            if (!apiKey) {
                return {
                    success: false,
                    output: null,
                    error: 'OpenAI API Key not configured',
                };
            }
            this.openai = new OpenAI({ apiKey });
        }

        try {
            const { model, prompt, temperature, maxTokens } = input.data;

            // Interpolate prompt with input data
            const interpolatedPrompt = this.interpolate(prompt, input.input);

            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: interpolatedPrompt }],
                model: model || 'gpt-3.5-turbo',
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 1000,
            });

            return {
                success: true,
                output: {
                    content: completion.choices[0].message.content,
                    usage: completion.usage,
                },
            };
        } catch (error) {
            return {
                success: false,
                output: null,
                error: error.message,
            };
        }
    }

    private interpolate(template: string, data: any): string {
        // Simple {{variable}} interpolation
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }
            return value !== undefined ? value : match;
        });
    }
}
