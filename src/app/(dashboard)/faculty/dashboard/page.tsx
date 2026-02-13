"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, BookOpen, Bell, Plus, FileText, Calendar, GraduationCap } from "lucide-react";
import { useFacultyClasses, useFacultySubmissions, usePendingGrading } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { classes, loading: classesLoading } = useFacultyClasses();
  const { pendingCount, loading: pendingLoading } = usePendingGrading();

  const totalStudents = classes.reduce((acc, cls) => acc + cls.total_students, 0);
  const totalClasses = classes.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.fullName || "Faculty"}</h1>
          <p className="text-muted-foreground">Here's your teaching overview</p>
        </div>
        <Button className="gold" onClick={() => router.push("/faculty/assignments/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                {classesLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{totalStudents}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                {classesLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{totalClasses}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                {pendingLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{pendingCount}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Classes</p>
                {classesLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{classes.length}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gold-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-gold-500" />
                <span>My Subjects</span>
              </CardTitle>
              <CardDescription>Subjects you're teaching this semester</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/faculty/classes")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => router.push(`/faculty/subjects/${cls.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{cls.subject_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.branch_name} • {cls.course_type.replace(/_/g, " ")} • {cls.semester}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {cls.total_students} students
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {cls.subject_code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No subjects assigned</p>
                <p className="text-sm">Contact admin to assign subjects</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <span>Pending Reviews</span>
              </CardTitle>
              <CardDescription>Submissions awaiting grading</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/faculty/grading")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : pendingCount > 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-3xl font-bold">{pendingCount}</p>
                <p className="text-muted-foreground">submissions to grade</p>
                <Button
                  className="mt-4 gold"
                  onClick={() => router.push("/faculty/grading")}
                >
                  Start Grading
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-green-500" />
                </div>
                <p>All caught up!</p>
                <p className="text-sm">No pending submissions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common faculty tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start space-y-2"
                onClick={() => router.push("/faculty/assignments/new")}
              >
                <Plus className="h-5 w-5 text-gold-500" />
                <span className="font-medium">Create Assignment</span>
                <span className="text-xs text-muted-foreground">
                  Post new assignments
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start space-y-2"
                onClick={() => router.push("/faculty/attendance")}
              >
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Mark Attendance</span>
                <span className="text-xs text-muted-foreground">
                  Track student attendance
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start space-y-2"
                onClick={() => router.push("/faculty/notices")}
              >
                <Bell className="h-5 w-5 text-green-500" />
                <span className="font-medium">Post Notice</span>
                <span className="text-xs text-muted-foreground">
                  Announce to students
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
