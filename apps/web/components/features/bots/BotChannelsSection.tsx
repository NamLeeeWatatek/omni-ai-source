'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Plus, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import { Badge } from '@/components/ui/Badge';

interface Props {
    botId: string;
    botChannels: any[];
    onRefresh: () => void;
}

export function BotChannelsSection({ botId, botChannels, onRefresh }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [channelType, setChannelType] = useState('web');
    const [channelName, setChannelName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!channelName.trim()) {
            toast.error('Channel name is required');
            return;
        }

        try {
            setCreating(true);
            await botsApi.createChannel(botId, { type: channelType, name: channelName });
            toast.success('Channel created successfully');
            setShowModal(false);
            setChannelName('');
            setChannelType('web');
            onRefresh();
        } catch {
            toast.error('Failed to create channel');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (channelId: string, isActive: boolean) => {
        try {
            await botsApi.toggleChannel(botId, channelId, !isActive);
            toast.success('Channel status updated');
            onRefresh();
        } catch {
            toast.error('Failed to update channel');
        }
    };

    const handleDelete = async (channelId: string) => {
        if (!confirm('Are you sure you want to delete this channel?')) return;

        try {
            await botsApi.deleteChannel(botId, channelId);
            toast.success('Channel deleted');
            onRefresh();
        } catch {
            toast.error('Failed to delete channel');
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                <CardTitle>Channels</CardTitle>
                            </div>
                            <CardDescription>
                                Configure where your bot can interact with users
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowModal(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Channel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {botChannels.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No channels yet</h3>
                            <p className="text-muted-foreground mb-4 text-sm">
                                Add channels to make your bot available on different platforms
                            </p>
                            <Button onClick={() => setShowModal(true)} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Channel
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {botChannels.map((channel) => (
                                <div key={channel.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold">{channel.name}</h4>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {channel.type}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={channel.isActive ? 'default' : 'secondary'}
                                            className={
                                                channel.isActive
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : ''
                                            }
                                        >
                                            {channel.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleToggle(channel.id, channel.isActive)}
                                        >
                                            {channel.isActive ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(channel.id)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            { }
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Channel</DialogTitle>
                        <DialogDescription>
                            Connect your bot to a new communication channel
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="channel-type">Channel Type</Label>
                            <Select value={channelType} onValueChange={setChannelType}>
                                <SelectTrigger id="channel-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="web">Web Widget</SelectItem>
                                    <SelectItem value="facebook">Facebook Messenger</SelectItem>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="slack">Slack</SelectItem>
                                    <SelectItem value="discord">Discord</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="channel-name">Channel Name</Label>
                            <Input
                                id="channel-name"
                                placeholder="My Website Chat"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                            />
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                After creating the channel, you'll receive configuration details and
                                integration instructions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? 'Creating...' : 'Create Channel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

