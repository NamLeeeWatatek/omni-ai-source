'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';

interface AssignBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: {
    id: string;
    name: string;
    type: string;
    botId?: string | null;
  } | null;
  workspaceId: string;
  onSuccess?: () => void;
}

interface BotOption {
  id: string;
  name: string;
  status: string;
  aiModelName?: string;
}

export function AssignBotDialog({
  open,
  onOpenChange,
  channel,
  workspaceId,
  onSuccess,
}: AssignBotDialogProps) {
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && workspaceId) {
      loadBots();
    }
  }, [open, workspaceId]);

  useEffect(() => {
    if (channel?.botId) {
      setSelectedBotId(channel.botId);
    } else {
      setSelectedBotId('');
    }
  }, [channel]);

  const loadBots = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/bots?workspaceId=${workspaceId}`);
      
      let botsList: BotOption[] = [];
      if (Array.isArray(response.data)) {
        botsList = response.data;
      } else if (response.data?.items) {
        botsList = response.data.items;
      }

      // Filter active bots
      const activeBots = botsList.filter((b: any) => b.status === 'active' || b.isActive);
      setBots(activeBots);

    } catch (error) {
      console.error('Failed to load bots:', error);
      toast.error('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!channel || !selectedBotId) {
      toast.error('Please select a bot');
      return;
    }

    try {
      setSaving(true);

      // Update channel with botId
      await axiosClient.patch(`/channels/${channel.id}`, {
        botId: selectedBotId,
      });

      toast.success('Bot assigned successfully');
      onSuccess?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Failed to assign bot:', error);
      toast.error(error.response?.data?.message || 'Failed to assign bot');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!channel) return;

    try {
      setSaving(true);

      // Remove bot from channel
      await axiosClient.patch(`/channels/${channel.id}`, {
        botId: null,
      });

      toast.success('Bot removed successfully');
      setSelectedBotId('');
      onSuccess?.();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Failed to remove bot:', error);
      toast.error(error.response?.data?.message || 'Failed to remove bot');
    } finally {
      setSaving(false);
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Assign Bot to Channel
          </DialogTitle>
          <DialogDescription>
            Select a bot to handle messages from <strong>{channel.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Info */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{channel.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
              </div>
              {channel.botId && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Bot Assigned
                </Badge>
              )}
            </div>
          </div>

          {/* Bot Selector */}
          <div className="space-y-2">
            <Label htmlFor="bot-select">Select Bot</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            ) : bots.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active bots found</p>
                <p className="text-xs mt-1">Create a bot first in the Bots page</p>
              </div>
            ) : (
              <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                <SelectTrigger id="bot-select">
                  <SelectValue placeholder="Select a bot..." />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span>{bot.name}</span>
                        {bot.aiModelName && (
                          <Badge variant="outline" className="text-xs">
                            {bot.aiModelName}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> The selected bot will automatically respond to messages from this channel.
              You can take over manually anytime.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {channel.botId && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
            >
              Remove Bot
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedBotId || saving || loading}
          >
            {saving ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              'Assign Bot'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
