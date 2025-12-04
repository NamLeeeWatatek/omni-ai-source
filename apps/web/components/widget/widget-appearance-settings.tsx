'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, MapPin, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

interface WidgetAppearanceSettings {
    primaryColor?: string;
    backgroundColor?: string;
    botMessageColor?: string;
    botMessageTextColor?: string;
    fontFamily?: string;
    widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    widgetButtonSize?: 'small' | 'medium' | 'large';
    welcomeMessage?: string;
    placeholderText?: string;
    showAvatar?: boolean;
    showTimestamp?: boolean;
}

interface Props {
    botId: string;
    currentSettings?: WidgetAppearanceSettings;
    onSave: (settings: WidgetAppearanceSettings) => Promise<void>;
}

export function WidgetAppearanceSettings({ botId, currentSettings, onSave }: Props) {
    const [settings, setSettings] = useState<WidgetAppearanceSettings>({
        primaryColor: currentSettings?.primaryColor || '#667eea',
        backgroundColor: currentSettings?.backgroundColor || '#ffffff',
        botMessageColor: currentSettings?.botMessageColor || '#f9fafb',
        botMessageTextColor: currentSettings?.botMessageTextColor || '#1f2937',
        fontFamily: currentSettings?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        widgetPosition: currentSettings?.widgetPosition || 'bottom-right',
        widgetButtonSize: currentSettings?.widgetButtonSize || 'medium',
        welcomeMessage: currentSettings?.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholderText: currentSettings?.placeholderText || 'Nhập tin nhắn...',
        showAvatar: currentSettings?.showAvatar ?? true,
        showTimestamp: currentSettings?.showTimestamp ?? true,
    });

    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (currentSettings) {
            const newSettings = {
                primaryColor: currentSettings.primaryColor || '#667eea',
                backgroundColor: currentSettings.backgroundColor || '#ffffff',
                botMessageColor: currentSettings.botMessageColor || '#f9fafb',
                botMessageTextColor: currentSettings.botMessageTextColor || '#1f2937',
                fontFamily: currentSettings.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                widgetPosition: currentSettings.widgetPosition || 'bottom-right',
                widgetButtonSize: currentSettings.widgetButtonSize || 'medium',
                welcomeMessage: currentSettings.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?',
                placeholderText: currentSettings.placeholderText || 'Nhập tin nhắn...',
                showAvatar: currentSettings.showAvatar ?? true,
                showTimestamp: currentSettings.showTimestamp ?? true,
            };
            setSettings(newSettings);
            setHasChanges(false);
        }
    }, [currentSettings]);

    useEffect(() => {
        if (!currentSettings) return;

        const changed = 
            settings.primaryColor !== (currentSettings.primaryColor || '#667eea') ||
            settings.backgroundColor !== (currentSettings.backgroundColor || '#ffffff') ||
            settings.botMessageColor !== (currentSettings.botMessageColor || '#f9fafb') ||
            settings.botMessageTextColor !== (currentSettings.botMessageTextColor || '#1f2937') ||
            settings.fontFamily !== (currentSettings.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto') ||
            settings.widgetPosition !== (currentSettings.widgetPosition || 'bottom-right') ||
            settings.widgetButtonSize !== (currentSettings.widgetButtonSize || 'medium') ||
            settings.welcomeMessage !== (currentSettings.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?') ||
            settings.placeholderText !== (currentSettings.placeholderText || 'Nhập tin nhắn...') ||
            settings.showAvatar !== (currentSettings.showAvatar ?? true) ||
            settings.showTimestamp !== (currentSettings.showTimestamp ?? true);

        setHasChanges(changed);
    }, [settings, currentSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(settings);
            toast.success('Widget appearance updated successfully!');
            setHasChanges(false);
        } catch {
            toast.error('Failed to update widget appearance');
        } finally {
            setSaving(false);
        }
    };

    const buttonSizeMap = {
        small: '48px',
        medium: '56px',
        large: '64px',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Widget Appearance
                </CardTitle>
                <CardDescription>
                    Customize how your chat widget looks and feels
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {}
                <div className="border rounded-lg p-6 bg-muted/30">
                    <p className="text-sm font-medium mb-4">Preview</p>
                    <div className="relative h-[200px] bg-background rounded-lg border overflow-hidden">
                        {}
                        <button
                            style={{
                                position: 'absolute',
                                [settings.widgetPosition?.includes('right') ? 'right' : 'left']: '20px',
                                [settings.widgetPosition?.includes('bottom') ? 'bottom' : 'top']: '20px',
                                width: buttonSizeMap[settings.widgetButtonSize || 'medium'],
                                height: buttonSizeMap[settings.widgetButtonSize || 'medium'],
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${adjustColor(settings.primaryColor || '#667eea', -20)} 100%)`,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {}
                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">Colors</h3>
                    
                    {}
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Primary Color (Button & User Messages)
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="primaryColor"
                                type="color"
                                value={settings.primaryColor}
                                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={settings.primaryColor}
                                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                placeholder="#667eea"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {}
                    <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Chat Background Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="backgroundColor"
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                                className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={settings.backgroundColor}
                                onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                                placeholder="#ffffff"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {}
                    <div className="space-y-2">
                        <Label htmlFor="botMessageColor">Bot Message Background</Label>
                        <div className="flex gap-2">
                            <Input
                                id="botMessageColor"
                                type="color"
                                value={settings.botMessageColor}
                                onChange={(e) => setSettings({ ...settings, botMessageColor: e.target.value })}
                                className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={settings.botMessageColor}
                                onChange={(e) => setSettings({ ...settings, botMessageColor: e.target.value })}
                                placeholder="#f9fafb"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {}
                    <div className="space-y-2">
                        <Label htmlFor="botMessageTextColor">Bot Message Text Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="botMessageTextColor"
                                type="color"
                                value={settings.botMessageTextColor}
                                onChange={(e) => setSettings({ ...settings, botMessageTextColor: e.target.value })}
                                className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={settings.botMessageTextColor}
                                onChange={(e) => setSettings({ ...settings, botMessageTextColor: e.target.value })}
                                placeholder="#1f2937"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {}
                    <div className="space-y-2">
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <Input
                            id="fontFamily"
                            value={settings.fontFamily}
                            onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                            placeholder="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"
                        />
                        <p className="text-xs text-muted-foreground">
                            CSS font-family value for chat text
                        </p>
                    </div>
                </div>

                {}
                <div className="space-y-2">
                    <Label htmlFor="position" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Widget Position
                    </Label>
                    <Select
                        value={settings.widgetPosition}
                        onValueChange={(value: any) => setSettings({ ...settings, widgetPosition: value })}
                    >
                        <SelectTrigger id="position">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Where the widget button appears on the page
                    </p>
                </div>

                {}
                <div className="space-y-2">
                    <Label htmlFor="buttonSize" className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        Button Size
                    </Label>
                    <Select
                        value={settings.widgetButtonSize}
                        onValueChange={(value: any) => setSettings({ ...settings, widgetButtonSize: value })}
                    >
                        <SelectTrigger id="buttonSize">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="small">Small (48px)</SelectItem>
                            <SelectItem value="medium">Medium (56px)</SelectItem>
                            <SelectItem value="large">Large (64px)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Size of the floating chat button
                    </p>
                </div>

                {}
                <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Input
                        id="welcomeMessage"
                        value={settings.welcomeMessage}
                        onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                        placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
                    />
                    <p className="text-xs text-muted-foreground">
                        First message shown when the widget opens
                    </p>
                </div>

                {}
                <div className="space-y-2">
                    <Label htmlFor="placeholderText">Input Placeholder</Label>
                    <Input
                        id="placeholderText"
                        value={settings.placeholderText}
                        onChange={(e) => setSettings({ ...settings, placeholderText: e.target.value })}
                        placeholder="Nhập tin nhắn..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Placeholder text in the message input field
                    </p>
                </div>

                {}
                <Button 
                    onClick={handleSave} 
                    disabled={saving || !hasChanges} 
                    className="w-full"
                >
                    {saving ? 'Saving...' : hasChanges ? 'Save Appearance Settings' : 'No Changes'}
                </Button>
                {hasChanges && (
                    <p className="text-xs text-muted-foreground text-center">
                        You have unsaved changes
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
