"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { validatePIN, COLLEGE_CODE, getDeptName, getYearDisplay } from "@/lib/pin-validator";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, AlertCircle } from "lucide-react";

interface PreImportedStudent {
  id: string;
  pin_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  year: string;
  semester: string;
  course_code: string;
  course_name: string;
}

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [step, setStep] = React.useState<"pin" | "details" | "success">("pin");
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    pinNumber: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [preImportedData, setPreImportedData] = React.useState<PreImportedStudent | null>(null);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const pinValidation = validatePIN(formData.pinNumber);

    if (!formData.pinNumber.trim()) {
      newErrors.pinNumber = "PIN number is required";
    } else if (!pinValidation.valid) {
      newErrors.pinNumber = pinValidation.errors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    } else if (!formData.email.endsWith("@gmail.com")) {
      newErrors.email = "Only @gmail.com email addresses are allowed";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyPIN = async () => {
    if (!validateStep1()) return;

    setIsLoading(true);

    try {
      const pinValidation = validatePIN(formData.pinNumber);

      const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("is_active", true)
        .single();

      const institutionId = institution?.id || "default";

      const { data: preImport, error } = await supabase
        .from("student_pre_imports")
        .select("*")
        .eq("institution_id", institutionId)
        .eq("pin_number", pinValidation.valid ? formData.pinNumber.toUpperCase() : "")
        .is("is_registered", false)
        .single();

      if (error || !preImport) {
        toast({
          title: "PIN Not Found",
          description: "This PIN is not registered. Please contact your administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setPreImportedData(preImport);
      setStep("details");
      toast({
        title: "PIN Verified",
        description: "Your academic details have been found.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      const pinValidation = validatePIN(formData.pinNumber);

      const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("is_active", true)
        .single();

      const institutionId = institution?.id || "default";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            pin_number: pinValidation.valid ? formData.pinNumber.toUpperCase() : "",
            role: "STUDENT",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          full_name: preImportedData
            ? `${preImportedData.first_name} ${preImportedData.last_name || ""}`.trim()
            : "Student",
          pin_number: formData.pinNumber.toUpperCase(),
          year: pinValidation.valid ? pinValidation.yearFull : "",
          semester: preImportedData?.semester || "",
          course_code: preImportedData?.course_code || "",
          course_name: preImportedData?.course_name || "",
          department: pinValidation.valid ? getDeptName(pinValidation.deptCode) : "",
        });

        if (profileError) throw profileError;

        if (preImportedData) {
          await supabase
            .from("student_pre_imports")
            .update({
              is_registered: true,
              registered_at: new Date().toISOString(),
              email: formData.email,
            })
            .eq("id", preImportedData.id);
        }

        await supabase
          .from("users")
          .update({
            institution_id: institutionId,
            pin_number: formData.pinNumber.toUpperCase(),
          })
          .eq("id", authData.user.id);

        setStep("success");
        toast({
          title: "Account Created!",
          description: "Welcome to UNI Manager!",
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pinValidation = validatePIN(formData.pinNumber);

  if (step === "success") {
    return (
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl gold-text">Account Created!</CardTitle>
          <CardDescription>Welcome to UNI Manager</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Your account has been created successfully.
            {preImportedData && (
              <span className="block mt-2">
                You are registered for{" "}
                <span className="text-gold-500 font-semibold">
                  {preImportedData.course_name}
                </span>
              </span>
            )}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full gold"
            onClick={() => router.push("/student/dashboard")}
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl gold-text">
          {step === "pin" ? "Register" : "Complete Registration"}
        </CardTitle>
        <CardDescription>
          {step === "pin"
            ? "Enter your PIN to get started"
            : "Create your account"}
        </CardDescription>
      </CardHeader>

      {step === "pin" && (
        <>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pinNumber">PIN Number</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pinNumber"
                  placeholder="23622-CM-001"
                  className="pl-10 uppercase"
                  value={formData.pinNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, pinNumber: e.target.value.toUpperCase() })
                  }
                  error={!!errors.pinNumber}
                  disabled={isLoading}
                />
              </div>
              {errors.pinNumber ? (
                <p className="text-sm text-red-500">{errors.pinNumber}</p>
              ) : formData.pinNumber.length > 0 && !pinValidation.valid ? (
                <p className="text-sm text-yellow-500">
                  Format: YY622-DEPT-PIN (e.g., 23622-CM-001)
                </p>
              ) : formData.pinNumber.length >= 12 && pinValidation.valid && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Valid PIN format</span>
                  </div>
                  {pinValidation.valid && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Year: {pinValidation.yearFull}</p>
                      <p>Department: {getDeptName(pinValidation.deptCode)}</p>
                      <p>Student No: {pinValidation.studentPin}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full gold"
              onClick={handleVerifyPIN}
              loading={isLoading}
              disabled={formData.pinNumber.length < 12}
            >
              Verify PIN
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <a href="/login" className="text-gold-500 hover:text-gold-400">
                Sign in
              </a>
            </p>
          </CardFooter>
        </>
      )}

      {step === "details" && (
        <>
          <CardContent className="space-y-4">
            {preImportedData && (
              <div className="p-4 rounded-lg bg-gold-500/10 border border-gold-500/20 mb-4">
                <h4 className="font-medium text-gold-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Academic Details Found
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {preImportedData.first_name} {preImportedData.last_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Course:</span>{" "}
                    {preImportedData.course_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Year/Sem:</span>{" "}
                    {preImportedData.year}, Semester {preImportedData.semester}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@gmail.com"
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
                  placeholder="Create a strong password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  error={!!errors.confirmPassword}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pin")}>
                Back
              </Button>
              <Button className="flex-1 gold" onClick={handleSubmit} loading={isLoading}>
                Create Account
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
