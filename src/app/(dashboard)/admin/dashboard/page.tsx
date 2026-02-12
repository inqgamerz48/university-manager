"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, Building, Bell, Settings, Shield, Activity } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminStats, useRecentActivity } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { activities, loading: activityLoading } = useRecentActivity(10);
  const { user } = useAuthStore();
  const router = useRouter();

  const statItems = [
    {
      label: "Total Students",
      value: stats?.totalStudents?.toLocaleString() || "0",
      icon: GraduationCap,
      color: "text-blue-500",
      change: "+12%",
      changeType: "positive",
    },
    {
      label: "Faculty Members",
      value: stats?.totalFaculty?.toLocaleString() || "0",
      icon: Users,
      color: "text-green-500",
      change: "+3",
      changeType: "positive",
    },
    {
      label: "Branches",
      value: stats?.totalBranches?.toLocaleString() || "0",
      icon: Building,
      color: "text-gold-500",
      change: "Active",
      changeType: "neutral",
    },
    {
      label: "Pending Complaints",
      value: stats?.pendingComplaints?.toLocaleString() || "0",
      icon: BookOpen,
      color: "text-red-500",
      change: "Needs attention",
      changeType: stats?.pendingComplaints ? "negative" : "neutral",
    },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("login") || action.includes("auth")) return "🔐";
    if (action.includes("create") || action.includes("insert")) return "➕";
    if (action.includes("update") || action.includes("edit")) return "✏️";
    if (action.includes("delete") || action.includes("remove")) return "🗑️";
    if (action.includes("grade") || action.includes("submit")) return "📝";
    if (action.includes("attendance")) return "📅";
    if (action.includes("complaint")) return "⚠️";
    return "📌";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-black font-bold">U</span>
            </div>
            <span className="font-bold text-lg">Admin Dashboard</span>
            <Badge variant="outline" className="ml-2 bg-gold-500/10 text-gold-400 border-gold-500/20">
              {user?.role || "ADMIN"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/rbac")}>
              <Shield className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-gold-500 text-black">
                {user?.fullName?.substring(0, 2).toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Overview</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.fullName || "Administrator"}
            </p>
          </div>
          <Button className="gold" onClick={() => router.push("/admin/rbac")}>
            <Shield className="h-4 w-4 mr-2" />
            Manage Access
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat, index) => (
            <Card key={index} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {statsLoading ? (
                      <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-bold">{stat.value}</p>
                    )}
                    <p className={`text-xs ${
                      stat.changeType === "positive" ? "text-green-500" :
                      stat.changeType === "negative" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <stat.icon className={`h-10 w-10 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gold-500" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 8).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gold-500/20 text-gold-400">
                          {getActivityIcon(activity.action)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user?.profiles?.full_name || activity.user?.email || "System"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {activity.entity_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Actions will appear here as users interact with the system</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start space-y-2"
                  onClick={() => router.push("/admin/rbac")}
                >
                  <Users className="h-5 w-5 text-gold-500" />
                  <span className="font-medium">Manage Users</span>
                  <span className="text-xs text-muted-foreground">
                    {stats?.totalUsers || 0} total users
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start space-y-2"
                >
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">View Subjects</span>
                  <span className="text-xs text-muted-foreground">
                    {stats?.totalSubjects || 0} active subjects
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start space-y-2"
                >
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Student Records</span>
                  <span className="text-xs text-muted-foreground">
                    {stats?.totalStudents || 0} enrolled
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start space-y-2"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Settings</span>
                  <span className="text-xs text-muted-foreground">
                    System configuration
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
