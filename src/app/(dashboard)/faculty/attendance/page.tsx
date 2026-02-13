"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Check, X, Clock, Save } from "lucide-react";
import { useFacultyClasses } from "@/hooks/use-dashboard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StudentRow {
  studentId: string;
  name: string;
  pin: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

export default function FacultyAttendancePage() {
  const { classes, loading: classesLoading } = useFacultyClasses();
  const supabase = createClient();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);

  // Fetch students when subject + date are selected
  useEffect(() => {
    if (!selectedSubject || !selectedDate) return;

    async function fetchStudents() {
      setLoadingStudents(true);

      // Get enrolled students for selected subject
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          student_id,
          student:students(
            id,
            pin_number,
            user:users(
              profiles(full_name)
            )
          )
        `)
        .eq("subject_id", selectedSubject)
        .eq("is_active", true);

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      // Check for existing attendance records on this date
      const studentIds = enrollments.map((e: any) => e.student?.id).filter(Boolean);
      const { data: existing } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("subject_id", selectedSubject)
        .eq("date", selectedDate)
        .in("student_id", studentIds);

      const existingMap = new Map(
        (existing || []).map((r: any) => [r.student_id, r.status])
      );

      setExistingRecords(existingMap.size > 0);

      const rows: StudentRow[] = enrollments
        .map((e: any) => {
          const student = e.student;
          if (!student) return null;
          return {
            studentId: student.id,
            name: student.user?.profiles?.full_name || "Unknown",
            pin: student.pin_number || "",
            status: (existingMap.get(student.id) as StudentRow["status"]) || "PRESENT",
          };
        })
        .filter(Boolean) as StudentRow[];

      setStudents(rows);
      setLoadingStudents(false);
    }

    fetchStudents();
  }, [selectedSubject, selectedDate, supabase]);

  const toggleStatus = (index: number) => {
    setStudents((prev) => {
      const updated = [...prev];
      const order: StudentRow["status"][] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
      const current = order.indexOf(updated[index].status);
      updated[index] = { ...updated[index], status: order[(current + 1) % order.length] };
      return updated;
    });
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" as const })));
  };

  const markAllAbsent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "ABSENT" as const })));
  };

  const handleSave = async () => {
    if (students.length === 0) return;

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setSaving(false);
      return;
    }

    const records = students.map((s) => ({
      student_id: s.studentId,
      subject_id: selectedSubject,
      date: selectedDate,
      status: s.status,
      marked_by: user.id,
    }));

    const { error } = await supabase.from("attendance").upsert(records, {
      onConflict: "student_id,date,subject_id",
      ignoreDuplicates: false,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Attendance Saved",
        description: `Marked ${students.length} students for ${selectedDate}`,
      });
      setExistingRecords(true);
    }

    setSaving(false);
  };

  const statusConfig = {
    PRESENT: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: Check },
    ABSENT: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: X },
    LATE: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
    EXCUSED: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
  };

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Mark daily attendance for your classes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Left: Selectors */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Select Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Subject</label>
                {classesLoading ? (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                ) : (
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.code} - {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {students.length > 0 && (
            <Card className="glass-card">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400">Present</span>
                  <span className="font-bold">{presentCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-400">Absent</span>
                  <span className="font-bold">{absentCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="pt-2 border-t border-border space-y-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={markAllPresent}>
                    Mark All Present
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={markAllAbsent}>
                    Mark All Absent
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Student List */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                Student List
                {existingRecords && (
                  <Badge className="ml-2 bg-yellow-500/10 text-yellow-500">Editing Existing</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {students.length > 0
                  ? `${students.length} students enrolled`
                  : "Select a subject and date"}
              </CardDescription>
            </div>
            {students.length > 0 && (
              <Button className="gold" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-2">
                {students.map((student, index) => {
                  const config = statusConfig[student.status];
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => toggleStatus(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.pin}</p>
                        </div>
                      </div>
                      <Badge className={`${config.color} border cursor-pointer`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {student.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : selectedSubject ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students enrolled in this subject</p>
                <p className="text-sm">Students need to be enrolled first</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a subject and date to begin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
