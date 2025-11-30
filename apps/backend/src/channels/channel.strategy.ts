import { Injectable } from '@nestjs/common';
import {
    ChannelProvider,
    ChannelMessage,
    ChannelMessageResponse,
    IncomingMessage,
} from './interfaces/channel-provider.interface';
import { ChannelsService } from './channels.service';

/**
 * Strategy pattern for managing multiple channel providers
 */
@Injectable()
export class ChannelStrategy {
    private providers = new Map<string, ChannelProvider>();

    constructor(private channelsService: ChannelsService) { }

    /**
     * Register a channel provider
     */
    register(channelType: string, provider: ChannelProvider): void {
        this.providers.set(channelType, provider);
    }

    /**
     * Get a specific channel provider
     */
    getProvider(channelType: string): ChannelProvider {
        const provider = this.providers.get(channelType);
        if (!provider) {
            throw new Error(`Channel provider not found: ${channelType}`);
        }
        return provider;
    }

    /**
     * Send a message through a specific channel using stored credentials
     */
    async sendMessage(
        channelType: string,
        message: ChannelMessage,
        workspaceId?: number,
    ): Promise<ChannelMessageResponse> {
        // Get channel connection from database
        const connection = await this.channelsService.findByType(channelType, workspaceId);

        if (!connection) {
            return {
                success: false,
                error: `No active connection found for channel type: ${channelType}`,
            };
        }

        if (!connection.credential) {
            return {
                success: false,
                error: `No credentials configured for channel type: ${channelType}`,
            };
        }

        const provider = this.getProvider(channelType);

        // For Facebook, we need pageAccessToken and appSecret
        if (channelType === 'facebook' && 'setCredentials' in provider) {
            (provider as any).setCredentials(
                connection.accessToken || '',
                connection.credential.clientSecret || '',
            );
        }

        // For other providers, similar credential injection can be added

        return provider.sendMessage(message);
    }

    /**
     * Verify webhook for a specific channel
     */
    verifyWebhook(
        channelType: string,
        payload: any,
        signature: string,
    ): boolean {
        const provider = this.getProvider(channelType);
        return provider.verifyWebhook(payload, signature);
    }

    /**
     * Parse incoming message from a specific channel
     */
    parseIncomingMessage(channelType: string, payload: any): IncomingMessage {
        const provider = this.getProvider(channelType);
        return provider.parseIncomingMessage(payload);
    }

    /**
     * Get all registered channel types
     */
    getAvailableChannels(): string[] {
        return Array.from(this.providers.keys());
    }
}
