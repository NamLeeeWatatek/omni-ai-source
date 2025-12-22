"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface BotFormData {
  name: string;
  description: string;
  systemPrompt: string;
  aiProviderId: string | undefined;
  aiModelName: string;
  aiParameters: {
    temperature: number;
    max_tokens: number;
  };
  enableAutoLearn: boolean;
  isActive: boolean;
}

interface BotConfigurationTabProps {
  formData: BotFormData;
  onChange: (updates: Partial<BotFormData>) => void;
}

export function BotConfigurationTab({ formData, onChange }: BotConfigurationTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure your bot's basic settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bot Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="My Awesome Bot"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe what your bot does..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">Enable or disable your bot</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => onChange({ isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Set up your AI provider and model settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select value={formData.aiProviderId} onValueChange={(value) => onChange({ aiProviderId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiModel">Model</Label>
            <Select value={formData.aiModelName} onValueChange={(value) => onChange({ aiModelName: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.aiParameters.temperature}
                onChange={(e) => onChange({ aiParameters: { ...formData.aiParameters, temperature: parseFloat(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="4000"
                value={formData.aiParameters.max_tokens}
                onChange={(e) => onChange({ aiParameters: { ...formData.aiParameters, max_tokens: parseInt(e.target.value) } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BotSystemPromptTabProps {
  systemPrompt: string;
  onChange: (systemPrompt: string) => void;
}

export function BotSystemPromptTab({ systemPrompt, onChange }: BotSystemPromptTabProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>System Prompt</CardTitle>
        <CardDescription>Define how your bot should behave and respond</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={systemPrompt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="You are a helpful AI assistant..."
          rows={6}
        />
      </CardContent>
    </Card>
  );
}
