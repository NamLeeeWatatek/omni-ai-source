"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function BillingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Billing settings coming soon...</p>
      </CardContent>
    </Card>
  );
}
