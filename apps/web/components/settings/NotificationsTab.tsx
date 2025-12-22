"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Notification settings coming soon...</p>
      </CardContent>
    </Card>
  );
}
