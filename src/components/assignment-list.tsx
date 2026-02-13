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
import { useSubjects, createAssignment } from "@/hooks/use-dashboard";
import { Plus, BookOpen, Calendar, Users, Clock, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_grade: number;
  subject_code: string;
  subject_name: string;
  submissions_count: number;
  is_active: boolean;
}

export function AssignmentList() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    due_date: "",
    max_grade: "100",
    subject_id: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { subjects, loading: subjectsLoading } = useSubjects();
  const supabase = createClient();

  const fetchAssignments = async () => {
    if (!user) return;

    const { data: facultyData } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!facultyData) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("faculty_id", facultyData.id)
      .order("due_date", { ascending: false });

    setAssignments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [user, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Assignment deleted",
      });
      fetchAssignments();
    }
  };

  const handleCreate = async () => {
    if (!newAssignment.title || !newAssignment.due_date || !newAssignment.subject_id) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createAssignment({
      title: newAssignment.title,
      description: newAssignment.description || undefined,
      instructions: newAssignment.instructions || undefined,
      due_date: newAssignment.due_date,
      max_grade: parseFloat(newAssignment.max_grade),
      subject_id: newAssignment.subject_id,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Assignment created successfully",
        variant: "default",
      });
      setIsCreateOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        instructions: "",
        due_date: "",
        max_grade: "100",
        subject_id: "",
      });
      fetchAssignments();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return <Badge variant="destructive">Expired</Badge>;
    if (diffDays <= 1) return <Badge variant="warning">Due Soon</Badge>;
    return <Badge variant="outline">Active</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage class assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-8 w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gold">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new assignment
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    placeholder="Enter assignment title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={newAssignment.subject_id}
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Brief description of the assignment"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={newAssignment.instructions}
                    onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                    placeholder="Detailed instructions for students"
                    className="h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_grade">Max Grade</Label>
                    <Input
                      id="max_grade"
                      type="number"
                      value={newAssignment.max_grade}
                      onChange={(e) => setNewAssignment({ ...newAssignment, max_grade: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="gold" onClick={handleCreate}>
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : assignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
        <div className="grid gap-4">
          {assignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).map((assignment) => (
            <Card key={assignment.id} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{assignment.title}</h3>
                      {getStatusBadge(assignment.due_date)}
                    </div>
                    <p className="text-muted-foreground mb-4">{assignment.description}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{assignment.subject_code} - {assignment.subject_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{assignment.submissions_count} submissions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Max Grade: {assignment.max_grade}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(assignment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any assignments yet.
            </p>
            <Button className="gold" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Assignment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
