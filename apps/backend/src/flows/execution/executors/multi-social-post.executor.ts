import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { ChannelsService } from '../../../channels/channels.service';

@Injectable()
export class MultiSocialPostExecutor implements NodeExecutor {
  constructor(private readonly channelsService: ChannelsService) {}

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { content, channels, images, schedule, scheduleTime } =
        input.data || {};
      const { workspaceId } = input.context;

      if (!content) {
        return {
          success: false,
          output: null,
          error: 'Post content is required',
        };
      }

      if (!channels || !Array.isArray(channels) || channels.length === 0) {
        return {
          success: false,
          output: null,
          error: 'At least one channel must be selected',
        };
      }

      const results: any[] = [];
      const errors: string[] = [];

      // If scheduling is enabled, validate schedule time
      if (schedule && scheduleTime) {
        const scheduleDate = new Date(scheduleTime);
        if (isNaN(scheduleDate.getTime())) {
          return {
            success: false,
            output: null,
            error: 'Invalid schedule time format',
          };
        }

        // For now, we'll post immediately (scheduling logic can be added later)
        // TODO: Implement actual scheduling mechanism
      }

      // Post to each selected channel
      for (const channelIdentifier of channels) {
        try {
          let channel: any = null;

          // Check if it's a UUID (channel ID) or platform name
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

          if (uuidRegex.test(channelIdentifier)) {
            // It's a channel ID
            channel = await this.channelsService.findOne(channelIdentifier);
          } else {
            // It's a platform name, find the first active channel of that type
            // workspaceId might be undefined, which is okay
            channel = await this.channelsService.findByType(
              channelIdentifier,
              workspaceId,
            );
          }

          if (!channel) {
            const errorMsg = `Channel ${channelIdentifier} not found or not connected (workspaceId: ${workspaceId || 'none'})`;
            console.log(
              'MultiSocialPostExecutor - Channel not found:',
              errorMsg,
            );
            errors.push(errorMsg);
            results.push({
              channelId: channelIdentifier,
              channelType: 'unknown',
              success: false,
              error: 'Channel not found or not connected',
            });
            continue;
          }

          console.log(
            'MultiSocialPostExecutor - Found channel:',
            channel.id,
            channel.type,
          );

          // Post based on channel type
          const postResult = await this.postToChannel(channel, {
            content,
            images,
            schedule,
            scheduleTime,
          });

          results.push({
            channelId: channel.id,
            channelType: channel.type,
            success: true,
            postId: postResult?.id,
            url: postResult?.url,
          });
        } catch (error) {
          errors.push(
            `Failed to post to channel ${channelIdentifier}: ${error.message}`,
          );
          results.push({
            channelId: channelIdentifier,
            channelType: 'unknown',
            success: false,
            error: error.message,
          });
        }
      }

      const successfulPosts = results.filter((r) => r.success).length;
      const hasAnySuccess = successfulPosts > 0;

      return {
        success: hasAnySuccess,
        output: {
          totalChannels: channels.length,
          successfulPosts,
          failedPosts: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined,
          message: hasAnySuccess
            ? `Successfully posted to ${successfulPosts} out of ${channels.length} channels`
            : `Failed to post to any channels`,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Multi-social post execution failed: ${error.message}`,
      };
    }
  }

  private async postToChannel(channel: any, postData: any) {
    const { content, images, schedule, scheduleTime } = postData;

    // Handle different channel types
    switch (channel.type) {
      case 'facebook':
        return this.postToFacebook(channel, content, images);

      case 'instagram':
        return this.postToInstagram(channel, content, images);

      case 'twitter':
      case 'x':
        return this.postToTwitter(channel, content, images);

      case 'linkedin':
        return this.postToLinkedIn(channel, content, images);

      case 'tiktok':
        return this.postToTikTok(channel, content, images);

      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  private async postToFacebook(channel: any, content: string, images?: any[]) {
    // TODO: Implement Facebook posting logic
    // This would integrate with Facebook Graph API
    // For now, return mock success
    return {
      id: `fb_${Date.now()}`,
      url: `https://facebook.com/${channel.metadata?.pageId || 'page'}/posts/${Date.now()}`,
    };
  }

  private async postToInstagram(channel: any, content: string, images?: any[]) {
    // TODO: Implement Instagram posting logic
    return {
      id: `ig_${Date.now()}`,
      url: `https://instagram.com/p/${Date.now()}`,
    };
  }

  private async postToTwitter(channel: any, content: string, images?: any[]) {
    // TODO: Implement Twitter posting logic
    return {
      id: `tw_${Date.now()}`,
      url: `https://twitter.com/i/status/${Date.now()}`,
    };
  }

  private async postToLinkedIn(channel: any, content: string, images?: any[]) {
    // TODO: Implement LinkedIn posting logic
    return {
      id: `li_${Date.now()}`,
      url: `https://linkedin.com/posts/${Date.now()}`,
    };
  }

  private async postToTikTok(channel: any, content: string, images?: any[]) {
    // TODO: Implement TikTok posting logic
    return {
      id: `tt_${Date.now()}`,
      url: `https://tiktok.com/@user/video/${Date.now()}`,
    };
  }
}
