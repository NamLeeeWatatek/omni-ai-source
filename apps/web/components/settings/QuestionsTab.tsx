"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function QuestionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help & Support</CardTitle>
        <CardDescription>Frequently asked questions and support</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">FAQ coming soon...</p>
      </CardContent>
    </Card>
  );
}
