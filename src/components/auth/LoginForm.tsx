"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({ email: "", password: "" });
  const [errors, setErrors] = React.useState({ email: "", password: "" });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Welcome back!" });

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        const role = profile?.role || "STUDENT";
        let redirectPath = "/student/dashboard";

        if (role === "FACULTY") redirectPath = "/faculty/dashboard";
        else if (role === "ADMIN" || role === "SUPER_ADMIN") redirectPath = "/admin/dashboard";

        router.push(redirectPath);
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold gold-text">Welcome Back</CardTitle>
        <CardDescription>Sign in to your UNI Manager account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!errors.email}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!errors.password}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="rounded border-gray-600 bg-muted" />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-gold-500 hover:text-gold-400">
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full gold" loading={isLoading}>
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{" "}
            <a href="/register" className="text-gold-500 hover:text-gold-400 font-semibold">
              Register here
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
