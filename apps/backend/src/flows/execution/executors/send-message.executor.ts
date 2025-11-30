import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { ChannelStrategy } from '../../../channels/channel.strategy';

/**
 * Executor for send-message nodes
 * Sends messages through configured channels (Facebook, Google, Omi, etc.)
 */
@Injectable()
export class SendMessageExecutor implements NodeExecutor {
  constructor(private readonly channelStrategy: ChannelStrategy) {}

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { channel, to, message } = input.data;

      if (!channel) {
        return {
          success: false,
          output: null,
          error: 'Channel type is required',
        };
      }

      if (!to || !message) {
        return {
          success: false,
          output: null,
          error: 'Recipient (to) and message are required',
        };
      }

      // Get workspaceId from context (TODO: implement workspace tracking in flows)
      const workspaceId = input.context?.workspaceId;

      // Send message through the specified channel with workspace context
      const result = await this.channelStrategy.sendMessage(
        channel,
        {
          to,
          content: message,
          metadata: input.data.metadata,
        },
        workspaceId,
      );

      if (!result.success) {
        return {
          success: false,
          output: null,
          error: result.error || 'Failed to send message',
        };
      }

      return {
        success: true,
        output: {
          messageId: result.messageId,
          channel,
          to,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Send message failed: ${error.message}`,
      };
    }
  }
}
