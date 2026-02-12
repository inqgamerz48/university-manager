"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotices, createNotice } from "@/hooks/use-dashboard";
import { Bell, Plus, Calendar, User, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string;
  published_at: string;
  published_by_name: string;
}

export function NoticeManagement() {
  const { user } = useAuthStore();
  const { notices, loading } = useNotices();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    priority: "normal",
    category: "general",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreate = async () => {
    if (!newNotice.title || !newNotice.content) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createNotice({
      title: newNotice.title,
      content: newNotice.content,
      priority: newNotice.priority,
      category: newNotice.category,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Notice published successfully",
        variant: "default",
      });
      setIsCreateOpen(false);
      setNewNotice({
        title: "",
        content: "",
        priority: "normal",
        category: "general",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "urgent":
        return <Badge className="bg-red-500">Urgent</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "border-l-blue-500";
      case "event":
        return "border-l-green-500";
      case "exam":
        return "border-l-orange-500";
      case "fee":
        return "border-l-gold-500";
      case "general":
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="text-muted-foreground">Manage and publish notices</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gold">
              <Plus className="h-4 w-4 mr-2" />
              Publish Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Publish New Notice</DialogTitle>
              <DialogDescription>
                Create and publish a notice for students and faculty
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="Notice title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newNotice.priority}
                    onValueChange={(value) => setNewNotice({ ...newNotice, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newNotice.category}
                    onValueChange={(value) => setNewNotice({ ...newNotice, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Notice content..."
                  className="h-48"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="gold" onClick={handleCreate}>
                Publish Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : notices.length > 0 ? (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <Card key={notice.id} className={`glass-card border-l-4 ${getCategoryColor(notice.category)}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{notice.title}</h3>
                      {getPriorityBadge(notice.priority)}
                      <Badge variant="outline">{notice.category}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                      {notice.content}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{notice.published_by_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(notice.published_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Notices</h3>
            <p className="text-muted-foreground mb-4">
              No notices have been published yet.
            </p>
            <Button className="gold" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Publish First Notice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
