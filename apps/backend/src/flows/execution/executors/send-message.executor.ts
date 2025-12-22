import { Injectable } from '@nestjs/common';
import {
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { ChannelStrategy } from '../../../channels/channel.strategy';
import { BaseNodeExecutor } from '../base-node-executor';

@Injectable()
export class SendMessageExecutor extends BaseNodeExecutor {
  constructor(private readonly channelStrategy: ChannelStrategy) {
    super();
  }

  protected async run(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { channelId, channel, to, message } = input.data;

      // Use channelId (new) or channel (legacy)
      const actualChannel = channelId || channel;

      if (!actualChannel) {
        return {
          success: false,
          output: null,
          error: 'Channel is required',
        };
      }

      if (!to || !message) {
        return {
          success: false,
          output: null,
          error: 'Recipient (to) and message are required',
        };
      }

      const workspaceId = input.context?.workspaceId;

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
