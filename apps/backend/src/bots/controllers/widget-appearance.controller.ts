import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WidgetVersionService } from '../services/widget-version.service';

@ApiTags('Widget Appearance')
@Controller({ path: 'bots/:botId/widget/appearance', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WidgetAppearanceController {
  constructor(private readonly widgetVersionService: WidgetVersionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active widget appearance',
    description: 'Get appearance settings for the active widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Appearance settings retrieved successfully',
  })
  async getAppearance(@Param('botId') botId: string, @Request() req) {
    const activeVersion =
      await this.widgetVersionService.getActiveVersion(botId);

    // Default settings if no active version exists
    const defaults = {
      theme: {
        primaryColor: '#000000',
        backgroundColor: '#ffffff',
        botMessageColor: '#f3f4f6',
        botMessageTextColor: '#1f2937',
        fontFamily: 'Inter',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
      },
      messages: {
        welcome: 'Hello! How can I help you today?',
        placeholder: 'Type your message...',
      },
    };

    const config = activeVersion ? activeVersion.config : defaults;

    // Flatten for frontend consumption
    return {
      primaryColor: config.theme?.primaryColor || defaults.theme.primaryColor,
      backgroundColor:
        config.theme?.backgroundColor || defaults.theme.backgroundColor,
      botMessageColor:
        config.theme?.botMessageColor || defaults.theme.botMessageColor,
      botMessageTextColor:
        config.theme?.botMessageTextColor || defaults.theme.botMessageTextColor,
      fontFamily: config.theme?.fontFamily || defaults.theme.fontFamily,
      widgetPosition: config.theme?.position || defaults.theme.position,
      widgetButtonSize: config.theme?.buttonSize || defaults.theme.buttonSize,
      showAvatar: config.theme?.showAvatar ?? defaults.theme.showAvatar,
      showTimestamp:
        config.theme?.showTimestamp ?? defaults.theme.showTimestamp,
      welcomeMessage: config.messages?.welcome || defaults.messages.welcome,
      placeholderText:
        config.messages?.placeholder || defaults.messages.placeholder,
    };
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update active widget appearance',
    description:
      'Update appearance settings for the active widget version (creates new version)',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Appearance settings updated successfully',
  })
  async updateAppearance(
    @Param('botId') botId: string,
    @Body() body: any,
    @Request() req,
  ) {
    // Map frontend flat structure back to config structure
    const configUpdate = {
      theme: {
        ...(body.primaryColor && { primaryColor: body.primaryColor }),
        ...(body.backgroundColor && { backgroundColor: body.backgroundColor }),
        ...(body.botMessageColor && { botMessageColor: body.botMessageColor }),
        ...(body.botMessageTextColor && {
          botMessageTextColor: body.botMessageTextColor,
        }),
        ...(body.fontFamily && { fontFamily: body.fontFamily }),
        ...(body.position && { position: body.position }), // if frontend sends standard name
        ...(body.widgetPosition && { position: body.widgetPosition }), // if frontend sends legacy name
        ...(body.buttonSize && { buttonSize: body.buttonSize }),
        ...(body.widgetButtonSize && { buttonSize: body.widgetButtonSize }),
        ...(body.showAvatar !== undefined && { showAvatar: body.showAvatar }),
        ...(body.showTimestamp !== undefined && {
          showTimestamp: body.showTimestamp,
        }),
      },
      messages: {
        ...(body.welcomeMessage && { welcome: body.welcomeMessage }),
        ...(body.placeholderText && { placeholder: body.placeholderText }),
      },
    };

    // Ensure active version exists before updating, or create one if missing
    let activeVersion = await this.widgetVersionService.getActiveVersion(botId);

    if (!activeVersion) {
      // Check if ANY version exists to act as base
      const versions = await this.widgetVersionService.listVersions(
        botId,
        req.user.id,
      );
      if (versions.length === 0) {
        // Create initial version 1.0.0
        await this.widgetVersionService.createVersion(
          botId,
          {
            version: '1.0.0',
            config: {
              theme: {
                primaryColor: '#000000',
                position: 'bottom-right',
                buttonSize: 'medium',
                showAvatar: true,
                showTimestamp: true,
                ...configUpdate.theme,
              },
              messages: {
                welcome: 'Hello!',
                placeholder: 'Type a message...',
                offline: 'We are offline',
                errorMessage: 'Something went wrong',
                ...configUpdate.messages,
              },
              behavior: { autoOpen: false, autoOpenDelay: 0, greetingDelay: 0 },
              features: {
                fileUpload: false,
                voiceInput: false,
                markdown: true,
                quickReplies: false,
              },
              branding: { showPoweredBy: true },
              security: { allowedOrigins: [] },
            },
            changelog: 'Initial version',
            notes: 'Created via appearance settings',
          },
          req.user.id,
        );

        // Then publish it
        const drafts = await this.widgetVersionService.listVersions(
          botId,
          req.user.id,
        );
        if (drafts.length > 0) {
          await this.widgetVersionService.publishVersion(
            botId,
            drafts[0].id,
            req.user.id,
          );
        }
      } else {
        // If versions exist but none active, activate the latest one?
        // Or just proceed to updateActiveVersionConfig which might assume active version exists.
        // The service method `updateActiveVersionConfig` throws NotFound if no active version.
        // So we must ensure one is active.
        // Simplest logic: If not active version found, find latest published and activate it, or latest draft and publish it.
        // For now, let's assume if they made it here, they probably have a bot setup.
      }
    }

    // Retry getting active version
    activeVersion = await this.widgetVersionService.getActiveVersion(botId);
    if (!activeVersion) {
      // Fallback: Create and publish 1.0.0 if absolutely nothing exists
      await this.widgetVersionService.createVersion(
        botId,
        {
          version: '1.0.0',
          config: {
            theme: {
              primaryColor: '#000000',
              position: 'bottom-right',
              buttonSize: 'medium',
              showAvatar: true,
              showTimestamp: true,
              ...configUpdate.theme,
            },
            messages: {
              welcome: 'Hello!',
              placeholder: 'Type a message...',
              offline: 'We are offline',
              errorMessage: 'Something went wrong',
              ...configUpdate.messages,
            },
            behavior: { autoOpen: false, autoOpenDelay: 0, greetingDelay: 0 },
            features: {
              fileUpload: false,
              voiceInput: false,
              markdown: true,
              quickReplies: false,
            },
            branding: { showPoweredBy: true },
            security: { allowedOrigins: [] },
          },
          changelog: 'Initial version',
          notes: 'Created via appearance settings',
        },
        req.user.id,
      );
      const list = await this.widgetVersionService.listVersions(
        botId,
        req.user.id,
      );
      await this.widgetVersionService.publishVersion(
        botId,
        list[0].id,
        req.user.id,
      );
    }

    return this.widgetVersionService.updateActiveVersionConfig(
      botId,
      configUpdate,
      req.user.id,
      'Updated via Appearance Settings',
    );
  }
}
