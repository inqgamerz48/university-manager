"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Server, GitBranch, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="text-muted-foreground">Overview of system configuration and health</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Environment Info
            </CardTitle>
            <CardDescription>Current deployment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Environment</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Production</Badge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Version</p>
                <p className="font-mono text-sm">v1.2.0 (Stable)</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Region</p>
                <p className="font-medium">ap-south-1 (Mumbai)</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                <p className="font-medium">Asia/Kolkata (IST)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-gold-500" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connector</span>
                <Badge variant="secondary">Supabase / PostgreSQL</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Connected
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RLS Policies</span>
                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Auth Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span>Supabase Auth</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MFA Status</span>
                <Badge variant="outline">Optional</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session Timeout</span>
                <span>1 hour</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
