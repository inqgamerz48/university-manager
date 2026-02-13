"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Calendar, Users, Trash2 } from "lucide-react";
import { createFeeStructure, getFeeStructures, deleteFeeStructure, getFeeStats, recordPayment } from "@/actions/fee-actions";
import { toast } from "@/hooks/use-toast";

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  category: string;
  academic_year: string;
  course_type: string;
  due_date: string;
  is_active: boolean;
  payments: { id: string; amount: number; status: string }[];
}

interface FeeStatsData {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  activeStructures: number;
}

export default function AdminFeesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [stats, setStats] = useState<FeeStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [feesResult, statsResult] = await Promise.all([
      getFeeStructures(),
      getFeeStats(),
    ]);

    if (feesResult.data) setFees(feesResult.data as FeeStructure[]);
    if (statsResult.data) setStats(statsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createFeeStructure(formData);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Fee structure created" });
      setIsCreateOpen(false);
      loadData();
    }

    setIsSubmitting(false);
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const feeId = formData.get("feeId") as string;
    const studentPin = formData.get("studentPin") as string;
    const method = formData.get("method") as string;

    const result = await recordPayment(feeId, studentPin, method);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment recorded successfully" });
      setIsPayOpen(false);
      loadData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeeStructure(id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Fee structure removed" });
      loadData();
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TUITION: "bg-blue-500/10 text-blue-500",
      EXAM: "bg-orange-500/10 text-orange-500",
      LAB: "bg-green-500/10 text-green-500",
      TRANSPORT: "bg-yellow-500/10 text-yellow-500",
      HOSTEL: "bg-red-500/10 text-red-500",
      LIBRARY: "bg-cyan-500/10 text-cyan-500",
    };
    return colors[category.toUpperCase()] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Manage fee structures and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gold">
                <Plus className="h-4 w-4 mr-2" />
                Create Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Fee Structure</DialogTitle>
                  <DialogDescription>Add a new fee structure for students</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Fee Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Tuition Fee 2026" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" placeholder="50000" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TUITION">Tuition</SelectItem>
                          <SelectItem value="EXAM">Exam</SelectItem>
                          <SelectItem value="LAB">Lab</SelectItem>
                          <SelectItem value="TRANSPORT">Transport</SelectItem>
                          <SelectItem value="HOSTEL">Hostel</SelectItem>
                          <SelectItem value="LIBRARY">Library</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Input id="academicYear" name="academicYear" placeholder="2025-26" defaultValue="2025-26" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="courseType">Course Type</Label>
                      <Select name="courseType" defaultValue="B_TECH">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B_TECH">B.Tech</SelectItem>
                          <SelectItem value="DIPLOMA">Diploma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" name="dueDate" type="date" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gold" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Fee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setIsPayOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
          <DialogContent>
            <form onSubmit={handleRecordPayment}>
              <DialogHeader>
                <DialogTitle>Record Manual Payment</DialogTitle>
                <DialogDescription>Mark a fee as paid for a student</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="feeId">Fee Structure</Label>
                  <Select name="feeId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee" />
                    </SelectTrigger>
                    <SelectContent>
                      {fees.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} ({formatCurrency(fee.amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentPin">Student PIN</Label>
                  <Input id="studentPin" name="studentPin" placeholder="e.g., 24622-CS-001" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select name="method" defaultValue="CASH">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ONLINE">Online/UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
                <Button type="submit" className="gold" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                {loading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{formatCurrency(stats?.totalCollected || 0)}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                {loading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{formatCurrency(stats?.totalPending || 0)}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                {loading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-red-500">{formatCurrency(stats?.totalOverdue || 0)}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Structures</p>
                {loading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.activeStructures || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>Manage fee structures for different courses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : fees.length > 0 ? (
            <div className="space-y-4">
              {fees.map((fee) => {
                const paidCount = fee.payments?.filter(p => p.status === "PAID").length || 0;
                const totalPayments = fee.payments?.length || 0;

                return (
                  <div key={fee.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-gold-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{fee.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {fee.academic_year} • Due: {new Date(fee.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getCategoryColor(fee.category)}>
                        {fee.category}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(fee.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {paidCount}/{totalPayments} paid
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fee structures created yet</p>
              <p className="text-sm">Click &quot;Create Fee Structure&quot; to add one</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
