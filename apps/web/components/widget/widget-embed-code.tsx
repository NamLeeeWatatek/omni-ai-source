'use client';

import { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
    botId: string;
    activeVersion?: {
        id: string;
        version: string;
        cdnUrl?: string;
    };
}

export function WidgetEmbedCode({ botId, activeVersion }: Props) {
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedIframe, setCopiedIframe] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const widgetUrl = `${apiUrl}/public/widget/${botId}`;

    const scriptCode = `<script 
    src="${widgetUrl}/loader.js"
    data-bot-id="${botId}"
    data-api-url="${apiUrl}"
    async
></script>`;
    const publicBotUrl = `${baseUrl}/public/bots/${botId}`;
    const iframeCode = `<iframe
  src="${publicBotUrl}"
  width="100%"
  height="100%"
  frameborder="0"
  style="border: none; min-height: 600px;"
></iframe>`;

    const copyToClipboard = async (text: string, type: 'script' | 'iframe') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'script') {
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
            } else if (type === 'iframe') {
                setCopiedIframe(true);
                setTimeout(() => setCopiedIframe(false), 2000);
            }
            toast.success('Copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    if (!activeVersion) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Embed Code</CardTitle>
                    <CardDescription>
                        No active version published yet. Publish a version to get the embed code.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Embed Your Chat Widget
                    </CardTitle>
                    <CardDescription>
                        Active Version: <span className="font-semibold">{activeVersion.version}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            {}
            <Tabs defaultValue="script" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="script">Script Tag</TabsTrigger>
                    <TabsTrigger value="iframe">iFrame</TabsTrigger>
                </TabsList>

                {}
                <TabsContent value="script" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">HTML Script Tag (Recommended)</CardTitle>
                            <CardDescription>
                                Add this code before the closing &lt;/body&gt; tag of your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{scriptCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(scriptCode, 'script')}
                                >
                                    {copiedScript ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {}
                <TabsContent value="iframe" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">iFrame Embed</CardTitle>
                            <CardDescription>
                                Same widget UI as Script Tag, but embedded as an iframe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{iframeCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                                >
                                    {copiedIframe ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Test Your Widget</CardTitle>
                    <CardDescription>
                        Test the widget in different ways
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.open(publicBotUrl, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Full Page Preview
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                const testHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Test</title>
</head>
<body>
    <h1>Widget Test Page</h1>
    <p>The widget should appear in the bottom-right corner.</p>
    ${scriptCode}
</body>
</html>`;
                                const blob = new Blob([testHtml], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                            }}
                        >
                            <Code className="w-4 h-4 mr-2" />
                            Test Embed Code
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Active version: <span className="font-mono font-semibold">{activeVersion.version}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
