/**
 * Message payload for sending messages through a channel
 */
export interface ChannelMessage {
  to: string; // Recipient ID (phone number, user ID, etc.)
  content: string; // Message text
  mediaUrl?: string; // Optional media attachment
  metadata?: Record<string, any>; // Channel-specific metadata
}

/**
 * Response from sending a message
 */
export interface ChannelMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Incoming message from a channel
 */
export interface IncomingMessage {
  from: string; // Sender ID
  content: string; // Message text
  timestamp: Date;
  channelType: string; // e.g., 'facebook', 'google', 'omi'
  metadata?: Record<string, any>;
}

/**
 * Interface that all channel providers must implement
 */
export interface ChannelProvider {
  /**
   * Unique identifier for this channel type
   */
  readonly channelType: string;

  /**
   * Send a message through this channel
   */
  sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse>;

  /**
   * Verify webhook signature (for incoming messages)
   */
  verifyWebhook(payload: any, signature: string): boolean;

  /**
   * Parse incoming webhook payload into IncomingMessage
   */
  parseIncomingMessage(payload: any): IncomingMessage;
}
