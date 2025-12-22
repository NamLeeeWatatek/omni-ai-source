"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export function AccountTab() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Set your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter your first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter your last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your.email@example.com" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timezone & Preferences</CardTitle>
          <CardDescription>Let us know the time zone and format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="New York" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="UTC/GMT -4 hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc-4">UTC/GMT -4 hours</SelectItem>
                  <SelectItem value="utc-5">UTC/GMT -5 hours</SelectItem>
                  <SelectItem value="utc+7">UTC/GMT +7 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date & Time Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="dd/mm/yyyy HH:MM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dmy">dd/mm/yyyy HH:MM</SelectItem>
                  <SelectItem value="mdy">mm/dd/yyyy HH:MM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
