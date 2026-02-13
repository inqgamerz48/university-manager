"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GraduationCap, BookOpen, Calendar, Bell, FileText, AlertCircle,
  DollarSign, Clock, CheckCircle, XCircle
} from "lucide-react";
import {
  useStudentAssignments, useStudentNotices, useStudentComplaints,
  useStudentFeeStatus, useStudentAttendance
} from "@/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { assignments, loading: assignmentsLoading } = useStudentAssignments();
  const { notices, loading: noticesLoading } = useStudentNotices();
  const { complaints, loading: complaintsLoading } = useStudentComplaints();
  const { feeStatus, loading: feeLoading } = useStudentFeeStatus();
  const { attendance, loading: attendanceLoading } = useStudentAttendance();

  const upcomingAssignments = assignments
    .filter((a) => !a.submitted && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const recentNotices = notices.slice(0, 5);

  const activeComplaints = complaints.filter(
    (c) => c.status === "PENDING" || c.status === "IN_PROGRESS"
  );

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

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    return diffDays;
  };

  const attendancePercentage = attendance.length > 0
    ? Math.round(attendance.reduce((acc, a) => acc + a.percentage, 0) / attendance.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-black font-bold">U</span>
            </div>
            <span className="font-bold text-lg">Student Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-gold-500 text-black">
                {user?.fullName?.substring(0, 2).toUpperCase() || "ST"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.fullName || "Student"}</h1>
          <p className="text-muted-foreground">Here's your academic overview</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  {attendanceLoading ? (
                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{attendancePercentage}%</p>
                      <Progress value={attendancePercentage} className="mt-2 h-2" />
                    </>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  attendancePercentage >= 75 ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <Calendar className={`h-6 w-6 ${
                    attendancePercentage >= 75 ? "text-green-500" : "text-red-500"
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Assignments</p>
                  {assignmentsLoading ? (
                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold">{upcomingAssignments.length}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Due soon</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fee Due</p>
                  {feeLoading ? (
                    <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold">
                        ₹{(feeStatus?.total_pending || 0).toLocaleString()}
                      </p>
                      {feeStatus && feeStatus.overdue && feeStatus.overdue > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          ₹{feeStatus.overdue.toLocaleString()} overdue
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-gold-500" />
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
                  <span>Upcoming Assignments</span>
                </CardTitle>
                <CardDescription>Assignments due soon</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/student/assignments")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAssignments.map((assignment) => {
                    const daysLeft = getDaysUntilDue(assignment.due_date);
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                        onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.subject_name} • Due {formatDate(assignment.due_date)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            daysLeft <= 1 ? "destructive" :
                            daysLeft <= 3 ? "warning" :
                            "outline"
                          }
                        >
                          {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming assignments</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <span>Recent Notices</span>
                </CardTitle>
                <CardDescription>Latest announcements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/student/notices")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {noticesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentNotices.length > 0 ? (
                <div className="space-y-4">
                  {recentNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{notice.title}</p>
                        <Badge
                          variant={notice.priority === "high" ? "destructive" : "outline"}
                        >
                          {notice.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notice.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notice.published_by_name} • {formatTime(notice.published_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent notices</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>My Complaints</span>
                </CardTitle>
                <CardDescription>Track your complaint status</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/student/complaints")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {complaintsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : activeComplaints.length > 0 ? (
                <div className="space-y-4">
                  {activeComplaints.slice(0, 5).map((complaint) => (
                    <div
                      key={complaint.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{complaint.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.category} • {formatTime(complaint.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          complaint.status === "PENDING" ? "warning" :
                          complaint.status === "IN_PROGRESS" ? "default" :
                          "secondary"
                        }
                      >
                        {complaint.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active complaints</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span>Fee Status</span>
                </CardTitle>
                <CardDescription>Your fee payments</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {feeLoading ? (
                <div className="space-y-4">
                  <div className="h-16 bg-muted animate-pulse rounded-lg" />
                  <div className="h-16 bg-muted animate-pulse rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Paid</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{(feeStatus?.total_paid || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Pending</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{(feeStatus?.total_pending || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {feeStatus && feeStatus.overdue > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center space-x-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Overdue</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{feeStatus.overdue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
