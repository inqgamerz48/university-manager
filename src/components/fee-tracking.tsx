"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Calendar, CheckCircle, Clock, AlertTriangle, Plus, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface FeePayment {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string;
  fee_structure: {
    name: string;
    category: string;
  };
  transaction_id?: string;
}

export function FeeTracking() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchFees() {
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("fee_payments")
        .select("*, fee_structure:fee_structures(name, category)")
        .eq("student_id", studentData.id)
        .order("due_date", { ascending: true });

      setPayments(data || []);
      setLoading(false);
    }

    if (user) {
      fetchFees();
    }
  }, [user, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const generateReceipt = (payment: FeePayment) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("UNIMANAGER", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("FEE RECEIPT", 105, 30, { align: "center" });

    // Details
    doc.setFontSize(12);
    doc.text(`Receipt ID: ${payment.transaction_id || payment.id.slice(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);

    // Student Info (Mock for now as we don't have name in payment obj easily accessible without prop drilling)
    // doc.text(`Student Name: ${user?.email}`, 20, 70); 

    // Payment Details Box
    doc.setDrawColor(200);
    doc.rect(20, 75, 170, 60);

    doc.text("Fee Details:", 25, 85);
    doc.setFont("helvetica", "bold");
    doc.text(`${payment.fee_structure.name} (${payment.fee_structure.category})`, 25, 95);
    doc.setFont("helvetica", "normal");

    doc.text("Amount Paid:", 130, 85);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${payment.amount.toLocaleString()}`, 130, 95);
    doc.setFont("helvetica", "normal");

    doc.text("Payment Status:", 25, 110);
    doc.setTextColor(0, 128, 0);
    doc.text("PAID", 25, 120);
    doc.setTextColor(40);

    doc.text("Payment Date:", 130, 110);
    doc.text(payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "-", 130, 120);

    // Footer
    doc.setFontSize(10);
    doc.text("This is a computer generated receipt.", 105, 150, { align: "center" });

    doc.save(`Receipt-${payment.fee_structure.name}.pdf`);
  };

  const totalDue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.amount, 0);
  const overdue = payments
    .filter((p) => p.status === "PENDING" && new Date(p.due_date) < new Date())
    .reduce((acc, p) => acc + p.amount, 0);

  const paymentProgress = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === "PENDING" && new Date(dueDate) < new Date();
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "PENDING":
        if (isOverdue) {
          return (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          );
        }
        return <Badge variant="warning">Pending</Badge>;
      case "WAIVED":
        return <Badge variant="secondary">Waived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Fee Management</h1>
        <p className="text-muted-foreground">Track your fee payments and dues</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                {loading ? (
                  <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">₹{totalDue.toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                {loading ? (
                  <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-green-500">₹{totalPaid.toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
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
                  <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-yellow-500">₹{totalPending.toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
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
                  <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-red-500">₹{overdue.toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
          <CardDescription>Overall fee payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Progress value={0} className="h-4" />
          ) : (
            <>
              <Progress value={paymentProgress} className="h-4 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                {paymentProgress}% Complete ({totalPaid.toLocaleString()} / {totalDue.toLocaleString()})
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Fee Details</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : payments.length > 0 ? (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {payment.fee_structure?.name || "Fee Payment"}
                      </h3>
                      {getStatusBadge(payment.status, payment.due_date)}
                      <Badge variant="outline">{payment.fee_structure?.category || "General"}</Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">₹{payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(payment.due_date)}</span>
                      </div>
                      {payment.paid_at && (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span>Paid on {formatDate(payment.paid_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {payment.status === "PENDING" && (
                      <Button className="gold">
                        <Plus className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    {payment.status === "PAID" && (
                      <Button variant="outline" size="sm" onClick={() => generateReceipt(payment)}>
                        <Download className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Fee Records</h3>
            <p className="text-muted-foreground">
              No fee records found for your account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
