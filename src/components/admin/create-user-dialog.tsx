"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/hooks/use-dashboard";

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { branches } = useBranches();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "STUDENT" as "STUDENT" | "FACULTY" | "ADMIN",
        pin_number: "",
        branch_id: "",
        admission_year: new Date().getFullYear().toString()
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast({ title: "Success", description: "User created successfully" });
                onSuccess();
                onOpenChange(false);
                setFormData({
                    email: "",
                    password: "",
                    full_name: "",
                    role: "STUDENT",
                    pin_number: "",
                    branch_id: "",
                    admission_year: new Date().getFullYear().toString()
                });
            } else {
                toast({ title: "Error", description: data.error || "Failed to create user", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Network error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Create a new user instantly. They can login with these credentials.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            required
                            placeholder="user@university.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            required
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v) => setFormData({ ...formData, role: v as any })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                    <SelectItem value="FACULTY">Faculty</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.role === "STUDENT" && (
                            <>
                                <div className="space-y-2">
                                    <Label>PIN / Roll No</Label>
                                    <Input
                                        required
                                        placeholder="e.g. 23622-CS-001"
                                        value={formData.pin_number}
                                        onChange={(e) => setFormData({ ...formData, pin_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Branch / Department</Label>
                                    <Select
                                        value={formData.branch_id}
                                        onValueChange={(v) => setFormData({ ...formData, branch_id: v })}
                                        required
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map((b: any) => (
                                                <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Admission Year</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.admission_year}
                                        onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {formData.role === "FACULTY" && (
                            <div className="space-y-2">
                                <Label>Employee ID</Label>
                                <Input
                                    required
                                    placeholder="e.g. EMP-001"
                                    value={formData.pin_number}
                                    onChange={(e) => setFormData({ ...formData, pin_number: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="gold" disabled={loading}>
                            {loading ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
