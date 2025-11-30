import { Controller, Post, Body, Headers, Param } from '@nestjs/common';
import { ChannelStrategy } from './channel.strategy';

/**
 * Controller for handling incoming webhooks from different channels
 */
@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly channelStrategy: ChannelStrategy) { }

    /**
     * Generic webhook endpoint for all channels
     * Route: POST /webhooks/:channel
     */
    @Post(':channel')
    async handleWebhook(
        @Param('channel') channel: string,
        @Body() payload: any,
        @Headers('x-hub-signature-256') facebookSignature?: string,
        @Headers('x-signature') genericSignature?: string,
    ) {
        try {
            // Determine which signature header to use
            const signature = facebookSignature || genericSignature || '';

            // Verify webhook signature
            const isValid = this.channelStrategy.verifyWebhook(
                channel,
                payload,
                signature,
            );

            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid webhook signature',
                };
            }

            // Parse incoming message
            const message = this.channelStrategy.parseIncomingMessage(
                channel,
                payload,
            );

            // TODO: Trigger workflow execution based on incoming message
            // This would involve:
            // 1. Finding flows with 'receive-message' trigger for this channel
            // 2. Executing those flows with the incoming message as input

            return {
                success: true,
                message: 'Webhook received',
                data: message,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Facebook webhook verification endpoint
     * Route: GET /webhooks/facebook
     */
    @Post('facebook/verify')
    verifyFacebookWebhook(@Body() query: any) {
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        // TODO: Get verify token from config
        const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return challenge;
        }

        return { success: false, error: 'Verification failed' };
    }
}
