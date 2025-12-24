"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { User, MapPin, Globe, Clock, Save } from 'lucide-react';

export function AccountTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Identity Profile</CardTitle>
              <CardDescription>System-wide personal identification and accessibility</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">First Name</Label>
              <Input id="firstName" placeholder="Enter your first name" className="rounded-xl border-border/50 bg-muted/20 h-11 focus:bg-background transition-all" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Last Name</Label>
              <Input id="lastName" placeholder="Enter your last name" className="rounded-xl border-border/50 bg-muted/20 h-11 focus:bg-background transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Primary Email Address</Label>
            <Input id="email" type="email" placeholder="your.email@example.com" className="rounded-xl border-border/50 bg-muted/20 h-11 focus:bg-background transition-all" />
          </div>
          <div className="flex justify-end pt-4">
            <Button className="rounded-full px-8 py-6 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Update Identity
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Localization & Context</CardTitle>
              <CardDescription>Regional standards and temporal synchronization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Location
              </Label>
              <Input placeholder="New York" className="rounded-xl border-border/50 bg-muted/20 h-10 focus:bg-background transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" /> Timezone
              </Label>
              <Select>
                <SelectTrigger className="rounded-xl border-border/50 bg-muted/20 h-10">
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
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Standard Format</Label>
              <Select>
                <SelectTrigger className="rounded-xl border-border/50 bg-muted/20 h-10">
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
