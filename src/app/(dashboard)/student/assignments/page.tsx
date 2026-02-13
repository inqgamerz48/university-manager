"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Calendar, Upload, CheckCircle, Clock, Award, Send } from "lucide-react";
import { useStudentAssignments } from "@/hooks/use-dashboard";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/hooks/use-toast";

export default function StudentAssignmentsPage() {
  const { assignments, loading } = useStudentAssignments();
  const { user } = useAuthStore();
  const supabase = createClient();

  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === "pending") return !a.submitted && new Date(a.due_date) > new Date();
    if (filter === "submitted") return a.submitted && !a.grade;
    if (filter === "graded") return a.grade !== undefined;
    return true;
  });

  const handleSubmit = async () => {
    if (!submitDialog || !submitContent.trim()) {
      toast({ title: "Error", description: "Please enter your submission content", variant: "destructive" });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    // Get student record
    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!studentData) {
      toast({ title: "Error", description: "Student record not found", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      assignment_id: submitDialog,
      student_id: studentData.id,
      content: submitContent,
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted!", description: "Your assignment has been submitted" });
      setSubmitDialog(null);
      setSubmitContent("");
      // Ideally we'd optimistic update here, but for now router refresh
      window.location.reload();
    }

    setIsSubmitting(false);
  };

  const selectedAssignment = assignments.find((a) => a.id === submitDialog);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">View and submit your assignments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "submitted", "graded"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "gold" : ""}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const daysLeft = getDaysUntilDue(assignment.due_date);
            const isExpired = daysLeft < 0;

            return (
              <Card key={assignment.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        {assignment.grade !== undefined ? (
                          <Badge className="bg-green-500/10 text-green-500">
                            <Award className="h-3 w-3 mr-1" />
                            {assignment.grade}/100
                          </Badge>
                        ) : assignment.submitted ? (
                          <Badge className="bg-blue-500/10 text-blue-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : daysLeft <= 1 ? (
                          <Badge className="bg-red-500/10 text-red-500">Due Soon</Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {daysLeft}d left
                          </Badge>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="text-muted-foreground mb-3">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{assignment.subject_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(assignment.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    {!assignment.submitted && !isExpired && (
                      <Button className="gold" onClick={() => setSubmitDialog(assignment.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
            <p className="text-muted-foreground">
              {filter === "all" ? "No assignments available yet" : `No ${filter} assignments`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={(open) => !open && setSubmitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>{selectedAssignment?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Your Response</label>
              <textarea
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
                placeholder="Enter your submission..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>Cancel</Button>
            <Button className="gold" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
