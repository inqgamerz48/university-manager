"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Award, Clock, CheckCircle, Search } from "lucide-react";
import { useFacultyClasses, usePendingGrading, gradeSubmission } from "@/hooks/use-dashboard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SubmissionRow {
  id: string;
  studentName: string;
  studentPin: string;
  assignmentTitle: string;
  subjectName: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
}

export default function FacultyGradingPage() {
  const { classes, loading: classesLoading } = useFacultyClasses();
  const { pendingCount } = usePendingGrading();
  const supabase = createClient();

  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeDialog, setGradeDialog] = useState<SubmissionRow | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [filter, setFilter] = useState<"pending" | "graded" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (classesLoading) return;

    async function fetchSubmissions() {
      setLoading(true);

      // Get all assignment IDs for faculty's subjects
      const subjectIds = classes.map((c: any) => c.id);
      if (subjectIds.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, subject_id, subject:subjects(name)")
        .in("subject_id", subjectIds);

      if (!assignments || assignments.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const assignmentIds = assignments.map((a) => a.id);

      let query = supabase
        .from("submissions")
        .select(`
          *,
          student:students(
            pin_number,
            user:users(profiles(full_name))
          )
        `)
        .in("assignment_id", assignmentIds)
        .order("submitted_at", { ascending: false });

      const { data: subs } = await query;

      if (subs) {
        const assignmentMap = new Map(
          assignments.map((a: any) => [
            a.id,
            { title: a.title, subjectName: a.subject?.name || "" },
          ])
        );

        setSubmissions(
          subs.map((s: any) => ({
            id: s.id,
            studentName: s.student?.user?.profiles?.full_name || "Unknown",
            studentPin: s.student?.pin_number || "",
            assignmentTitle: assignmentMap.get(s.assignment_id)?.title || "",
            subjectName: assignmentMap.get(s.assignment_id)?.subjectName || "",
            content: s.content,
            fileUrl: s.file_url,
            submittedAt: s.submitted_at,
            grade: s.grade,
            feedback: s.feedback,
          }))
        );
      }

      setLoading(false);
    }

    fetchSubmissions();
  }, [classes, classesLoading, supabase]);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesFilter =
      filter === "pending" ? s.grade === null :
        filter === "graded" ? s.grade !== null :
          true;

    if (!matchesFilter) return false;

    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(term) ||
      s.studentPin.toLowerCase().includes(term) ||
      s.assignmentTitle.toLowerCase().includes(term) ||
      s.subjectName.toLowerCase().includes(term)
    );
  });

  const openGradeDialog = (submission: SubmissionRow) => {
    setGradeDialog(submission);
    setGradeValue(submission.grade?.toString() || "");
    setFeedbackValue(submission.feedback || "");
  };

  const handleGrade = async () => {
    if (!gradeDialog) return;

    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({ title: "Error", description: "Grade must be 0-100", variant: "destructive" });
      return;
    }

    setIsGrading(true);
    const result = await gradeSubmission(gradeDialog.id, grade, feedbackValue || undefined);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Graded!", description: `${gradeDialog.studentName} — ${grade}/100` });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradeDialog.id
            ? { ...s, grade, feedback: feedbackValue }
            : s
        )
      );
      setGradeDialog(null);
    }

    setIsGrading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Grading</h1>
          <p className="text-muted-foreground">Review and grade student submissions</p>
        </div>
        <Badge className="bg-gold-500/10 text-gold-500 text-lg px-4 py-2">
          {pendingCount} Pending
        </Badge>
      </div>


      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, PIN, or assignment..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["pending", "graded", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "gold" : ""}
            >
              {f === "pending" && <Clock className="h-4 w-4 mr-1" />}
              {f === "graded" && <CheckCircle className="h-4 w-4 mr-1" />}
              {f === "all" && <FileText className="h-4 w-4 mr-1" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && ` (${submissions.filter((s) => s.grade === null).length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{filteredSubmissions.length} submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{sub.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.assignmentTitle} • {sub.subjectName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub.grade !== null ? (
                      <Badge className="bg-green-500/10 text-green-500">
                        <Award className="h-3 w-3 mr-1" />
                        {sub.grade}/100
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGradeDialog(sub)}
                    >
                      {sub.grade !== null ? "Edit Grade" : "Grade"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {filter === "pending" ? "pending" : filter === "graded" ? "graded" : ""} submissions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={!!gradeDialog} onOpenChange={(open) => !open && setGradeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {gradeDialog?.studentName} — {gradeDialog?.assignmentTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {gradeDialog?.content && (
              <div>
                <Label>Submission Content</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg text-sm max-h-40 overflow-y-auto">
                  {gradeDialog.content}
                </div>
              </div>
            )}
            {gradeDialog?.fileUrl && (
              <div>
                <Label>Attached File</Label>
                <a
                  href={gradeDialog.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-sm text-gold-500 hover:text-gold-400 underline"
                >
                  View Attachment
                </a>
              </div>
            )}
            <div>
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder="Enter grade"
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <textarea
                id="feedback"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={feedbackValue}
                onChange={(e) => setFeedbackValue(e.target.value)}
                placeholder="Add feedback for the student..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(null)}>Cancel</Button>
            <Button className="gold" onClick={handleGrade} disabled={isGrading}>
              {isGrading ? "Saving..." : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
