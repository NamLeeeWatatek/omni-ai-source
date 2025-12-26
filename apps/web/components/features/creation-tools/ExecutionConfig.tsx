import { useState, useEffect } from 'react';
import {
    ExecutionFlow,
    ExecutionType,
    AiExecutionConfig,
    HttpExecutionConfig
} from '@/lib/api/creation-tools';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Info, AlertTriangle, Code } from 'lucide-react';

interface ExecutionConfigProps {
    config: ExecutionFlow;
    onChange: (config: ExecutionFlow) => void;
}

export function ExecutionConfig({ config, onChange }: ExecutionConfigProps) {
    const handleTypeChange = (type: ExecutionType) => {
        // Reset config to defaults based on type
        if (type === 'ai-generation') {
            onChange({
                type: 'ai-generation',
                provider: 'openai',
                model: 'gpt-4o',
                promptTemplate: '',
                parameters: { temperature: 0.7 }
            });
        } else if (type === 'http-webhook') {
            onChange({
                type: 'http-webhook',
                urlTemplate: 'https://',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                bodyTemplate: '{\n  "input": "{{variable}}"\n}',
                timeoutMs: 5000,
                retryCount: 3
            });
        }
    };

    return (
        <div className="space-y-6 h-full overflow-y-auto px-1">
            <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <Label className="mb-2 block text-base font-medium">Execution Type</Label>
                    <Select
                        value={config.type}
                        onValueChange={(val) => handleTypeChange(val as ExecutionType)}
                    >
                        <SelectTrigger className="w-full h-11 bg-background">
                            <SelectValue placeholder="Select Execution Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ai-generation">AI Generation (LLM)</SelectItem>
                            <SelectItem value="http-webhook">HTTP Webhook (External API)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {config.type === 'ai-generation'
                            ? 'Generate content using internal AI providers (OpenAI, etc.)'
                            : 'Call external APIs or workflows via HTTP requests'
                        }
                    </p>
                </div>

                {config.type === 'ai-generation' && (
                    <AiConfigEditor
                        config={config as AiExecutionConfig}
                        onChange={(c) => onChange(c)}
                    />
                )}

                {config.type === 'http-webhook' && (
                    <HttpConfigEditor
                        config={config as HttpExecutionConfig}
                        onChange={(c) => onChange(c)}
                    />
                )}
            </div>
        </div>
    );
}

function AiConfigEditor({ config, onChange }: { config: AiExecutionConfig, onChange: (c: AiExecutionConfig) => void }) {
    return (
        <Card className="border-border/60 bg-card/40">
            <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                            value={config.provider}
                            onValueChange={(val) => onChange({ ...config, provider: val as any })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                            value={config.model}
                            onChange={(e) => onChange({ ...config, model: e.target.value })}
                            placeholder="e.g. gpt-4o, claude-3-5-sonnet"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex justify-between">
                        Prompt Template
                        <Badge variant="outline" className="text-[10px] font-normal font-mono">LiquidJS Supported</Badge>
                    </Label>
                    <div className="relative">
                        <Textarea
                            value={config.promptTemplate}
                            onChange={(e) => onChange({ ...config, promptTemplate: e.target.value })}
                            className="font-mono text-sm min-h-[200px] resize-y"
                            placeholder="Write a blog post about {{topic}}..."
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use <code>{`{{ variable_name }}`}</code> to allow users to inject data from the form.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function HttpConfigEditor({ config, onChange }: { config: HttpExecutionConfig, onChange: (c: HttpExecutionConfig) => void }) {
    const handleHeaderChange = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            onChange({ ...config, headers: parsed });
        } catch (e) {
            // Allow typing invalid JSON temporarily (controlled input), 
            // but ideally we'd use a state for the text and parse on blur.
            // For simplicity in this artifact, we assume user pastes valid JSON or uses a smarter editor in future.
        }
    };

    return (
        <Card className="border-border/60 bg-card/40">
            <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-[120px_1fr] gap-4">
                    <div className="space-y-2">
                        <Label>Method</Label>
                        <Select
                            value={config.method}
                            onValueChange={(val) => onChange({ ...config, method: val as any })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Target URL Template</Label>
                        <Input
                            value={config.urlTemplate}
                            onChange={(e) => onChange({ ...config, urlTemplate: e.target.value })}
                            className="font-mono text-sm"
                            placeholder="https://api.example.com/v1/resource/{{id}}"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        Headers
                        <span className="text-xs text-muted-foreground font-normal">(JSON)</span>
                    </Label>
                    <Textarea
                        defaultValue={JSON.stringify(config.headers, null, 2)}
                        onBlur={(e) => {
                            try { onChange({ ...config, headers: JSON.parse(e.target.value) }) }
                            catch { /* Ignore invalid JSON on blur or show error */ }
                        }}
                        className="font-mono text-xs h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            Body Template
                            <span className="text-xs text-muted-foreground font-normal">(LiquidJS + JSON)</span>
                        </span>
                    </Label>
                    <Textarea
                        value={config.bodyTemplate}
                        onChange={(e) => onChange({ ...config, bodyTemplate: e.target.value })}
                        className="font-mono text-xs min-h-[200px]"
                        placeholder={'{\n  "data": "{{ user_input }}",\n  "mode": "production"\n}'}
                    />
                    <div className="flex gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
                        <AlertTriangle className="w-4 h-4" />
                        Ensure the rendered output is valid JSON if the Content-Type is application/json.
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                            type="number"
                            value={config.timeoutMs}
                            onChange={(e) => onChange({ ...config, timeoutMs: parseInt(e.target.value) || 5000 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Retry Count</Label>
                        <Input
                            type="number"
                            value={config.retryCount}
                            onChange={(e) => onChange({ ...config, retryCount: parseInt(e.target.value) || 3 })}
                        />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
