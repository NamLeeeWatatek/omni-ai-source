import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class WebhookExecutorService {
    async execute(
        url: string,
        method: 'POST' | 'GET' = 'POST',
        payload?: any,
        headers?: Record<string, string>,
    ): Promise<any> {
        try {
            const config: AxiosRequestConfig = {
                method,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                timeout: 30000,
            };

            if (payload && method === 'POST') {
                config.data = payload;
            } else if (payload && method === 'GET') {
                config.params = payload;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error('[WebhookExecutor] Error:', error.message);
            throw new Error(`Webhook execution failed: ${error.message}`);
        }
    }

    async poll(
        statusUrl: string,
        config: {
            interval: number;
            maxAttempts: number;
            statusPath: string;
            completedValues: string[];
        },
        onProgress?: (progress: number) => void,
    ): Promise<any> {
        let attempts = 0;

        while (attempts < config.maxAttempts) {
            attempts++;

            try {
                const response = await this.execute(statusUrl, 'GET');

                // Extract status from response using statusPath
                const status = this.getNestedValue(response, config.statusPath);

                // Check if completed
                if (config.completedValues.includes(status)) {
                    return response;
                }

                // Emit progress
                if (onProgress) {
                    const progress = Math.min(50 + (attempts / config.maxAttempts) * 40, 90);
                    onProgress(progress);
                }

                // Wait before next attempt
                await this.sleep(config.interval);
            } catch (error) {
                console.error(`[WebhookExecutor] Poll attempt ${attempts} failed:`, error.message);

                if (attempts >= config.maxAttempts) {
                    throw error;
                }

                await this.sleep(config.interval);
            }
        }

        throw new Error('Polling timeout: Maximum attempts reached');
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
