"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Separator } from '@/components/ui/Separator';

interface BotSettingsTabProps {
  enableAutoLearn: boolean;
  onChange: (enableAutoLearn: boolean) => void;
  onDelete?: () => void;
}

export function BotSettingsTab({ enableAutoLearn, onChange, onDelete }: BotSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>Configure advanced bot settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Learning</Label>
            <p className="text-sm text-muted-foreground">Allow the bot to learn from conversations</p>
          </div>
          <Switch
            checked={enableAutoLearn}
            onCheckedChange={onChange}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Danger Zone</h4>
          <p className="text-sm text-muted-foreground">
            These actions cannot be undone. Please be careful.
          </p>
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              Delete Bot
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
