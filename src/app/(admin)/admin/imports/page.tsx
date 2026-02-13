"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, Users, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImportStats {
  total: number;
  registered: number;
  pending: number;
}

export default function ImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [stats, setStats] = React.useState<ImportStats | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [importType, setImportType] = React.useState<"students" | "grades">("students");

  React.useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/imports");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) { console.error("Failed to fetch stats:", error); }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) { setFile(droppedFile); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) setFile(selectedFile);
    }
  };

  const isValidFile = (file: File): boolean => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    return validExtensions.some((ext) => file.name.endsWith(ext));
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", importType);
    try {
      const response = await fetch("/api/imports", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      toast({ title: "Import Complete", description: `Imported ${data.imported} students` });
      fetchStats();
    } catch (error) {
      toast({ title: "Import Failed", description: error instanceof Error ? error.message : "Error", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const downloadTemplate = () => {
    let template = "";
    let filename = "";

    if (importType === "students") {
      template = `PIN,First Name,Last Name,Email,Year,Semester,Course Code,Course Name\n23622-CM-001,John,Doe,john@gmail.com,2026-27,1,CS101,Computer Science`;
      filename = "student_template.csv";
    } else {
      template = `PIN,Assignment ID,Grade,Feedback\n23622-CM-001,ASSIGN-123,85.5,Good work`;
      filename = "grades_template.csv";
    }

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({ title: "Template Downloaded", description: `Downloaded template for ${importType}` });
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-text mb-2">Bulk Student Import</h1>
          <p className="text-muted-foreground">Upload student data from Excel or CSV files</p>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList>
            <TabsTrigger value="import">Import Students</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-gold-500" />
                    Upload File
                  </CardTitle>
                  <CardDescription>Upload an Excel or CSV file with student data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Import Type</label>
                    <div className="flex gap-4">
                      <Button
                        variant={importType === "students" ? "default" : "outline"}
                        className={importType === "students" ? "gold" : ""}
                        onClick={() => setImportType("students")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Students
                      </Button>
                      <Button
                        variant={importType === "grades" ? "default" : "outline"}
                        className={importType === "grades" ? "gold" : ""}
                        onClick={() => setImportType("grades")}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Grades
                      </Button>
                    </div>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-gold-500 bg-gold-500/5" : "border-border hover:border-gold-500/50"}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {file ? (
                      <div className="space-y-2">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        <Button variant="outline" size="sm" onClick={() => setFile(null)}>Remove</Button>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2">
                          Drag and drop or{" "}
                          <label className="text-gold-500 cursor-pointer hover:underline">
                            browse
                            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                          </label>
                        </p>
                        <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .csv</p>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button className="flex-1 gold" onClick={handleUpload} disabled={!file || isLoading} loading={isLoading}>
                      {isLoading ? "Importing..." : "Import Students"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-gold-500" />
                    Download Template
                  </CardTitle>
                  <CardDescription>Download the template and fill in student data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Required Columns ({importType === "students" ? "Students" : "Grades"}):</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {importType === "students" ? (
                        <>
                          <li>PIN (e.g., 23622-CM-001)</li>
                          <li>First Name, Last Name, Email</li>
                          <li>Year, Semester, Course Code, Course Name</li>
                        </>
                      ) : (
                        <>
                          <li>PIN (e.g., 23622-CM-001)</li>
                          <li>Assignment ID (e.g., ASSIGN-123)</li>
                          <li>Grade (Numeric), Feedback (Text)</li>
                        </>
                      )}
                    </ul>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-gold-500" />
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/10 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{stats.registered}</p>
                        <p className="text-xs text-muted-foreground">Registered</p>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Imports</CardTitle>
                <CardDescription>View history of all bulk imports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Import history will be displayed here</p>
                  <p className="text-sm">Upload a file to see results</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
