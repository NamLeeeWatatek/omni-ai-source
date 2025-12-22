"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { MessageCircle, Users, Activity, BarChart3 } from 'lucide-react';

interface BotOverviewTabProps {
  bot: any;
}

export function BotOverviewTab({ bot }: BotOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">456</div>
          <p className="text-xs text-muted-foreground">+12.5% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.4s</div>
          <p className="text-xs text-muted-foreground">-0.2s from last month</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function BotAnalyticsTab({ bot }: BotOverviewTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>View your bot's performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground">
            Detailed analytics and insights will be available here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
