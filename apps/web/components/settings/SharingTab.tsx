"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function SharingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sharing Settings</CardTitle>
        <CardDescription>Manage sharing and collaboration</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Sharing settings coming soon...</p>
      </CardContent>
    </Card>
  );
}
