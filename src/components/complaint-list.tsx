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
import { useStudentComplaints, createComplaint, updateComplaintStatus } from "@/hooks/use-dashboard";
import { AlertCircle, Plus, Calendar, User, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
}

export function ComplaintList({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user } = useAuthStore();
  const { complaints, loading } = useStudentComplaints();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "normal",
  });
  const supabase = createClient();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleCreate = async () => {
    if (!newComplaint.title || !newComplaint.description) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createComplaint({
      title: newComplaint.title,
      description: newComplaint.description,
      category: newComplaint.category,
      priority: newComplaint.priority,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Complaint submitted successfully",
        variant: "default",
      });
      setIsCreateOpen(false);
      setNewComplaint({
        title: "",
        description: "",
        category: "general",
        priority: "normal",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (complaintId: string, status: string) => {
    const result = await updateComplaintStatus(
      complaintId,
      status,
      status === "RESOLVED" ? "Complaint resolved" : undefined
    );

    if (result.success) {
      toast({
        title: "Success",
        description: `Complaint marked as ${status.toLowerCase()}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "RESOLVED":
        return <Badge className="bg-green-500">Resolved</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return "📚";
      case "infrastructure":
        return "🏛️";
      case "faculty":
        return "👨‍🏫";
      case "fee":
        return "💰";
      case "placement":
        return "💼";
      default:
        return "📋";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage student complaints" : "Track your complaints"}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gold">
                <Plus className="h-4 w-4 mr-2" />
                Raise Complaint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raise New Complaint</DialogTitle>
                <DialogDescription>
                  Submit your complaint to the administration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                    placeholder="Brief title of your complaint"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newComplaint.category}
                      onValueChange={(value) => setNewComplaint({ ...newComplaint, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="fee">Fee Related</SelectItem>
                        <SelectItem value="placement">Placement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newComplaint.priority}
                      onValueChange={(value) => setNewComplaint({ ...newComplaint, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    placeholder="Detailed description of your complaint..."
                    className="h-32"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="gold" onClick={handleCreate}>
                  Submit Complaint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : complaints.length > 0 ? (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(complaint.category)}</span>
                      <h3 className="text-lg font-semibold">{complaint.title}</h3>
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                    <p className="text-muted-foreground mb-4">{complaint.description}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Filed: {formatDate(complaint.created_at)}</span>
                      </div>
                      <Badge variant="outline">{complaint.category}</Badge>
                      {complaint.resolved_at && (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span>Resolved: {formatDate(complaint.resolved_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(complaint.id, "IN_PROGRESS")}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        In Progress
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleStatusUpdate(complaint.id, "RESOLVED")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {isAdmin ? "No Complaints" : "No Complaints Filed"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin
                ? "No complaints have been filed by students."
                : "You haven't filed any complaints yet."}
            </p>
            {!isAdmin && (
              <Button className="gold" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                File First Complaint
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
