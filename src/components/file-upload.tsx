"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, File, FileText, Table, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  accept?: string[];
  maxSize?: number; // in MB
  onUploadComplete?: (url: string, fileName: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  showPreview?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

export function FileUpload({
  bucket,
  folder = "uploads",
  accept = ["pdf", "xlsx", "xls", "csv"],
  maxSize = 10,
  onUploadComplete,
  onError,
  buttonText = "Upload File",
  showPreview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const supabase = createClient();

  const validateFile = (file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !accept.includes(extension)) {
      return `Invalid file type. Allowed: ${accept.join(", ")}`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSize}MB`;
    }
    return null;
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      selectedFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        errors.forEach((error) => {
          toast({
            title: "Validation Error",
            description: error,
            variant: "destructive",
          });
        });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [accept, maxSize, toast]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      id: data.id,
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
      created_at: new Date().toISOString(),
    };
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const uploaded: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedFile = await uploadFile(file);
        if (uploadedFile) {
          uploaded.push(uploadedFile);
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadedFiles((prev) => [...prev, ...uploaded]);
      setFiles([]);

      uploaded.forEach((file) => {
        onUploadComplete?.(file.url, file.name);
      });

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${uploaded.length} file(s)`,
        variant: "default",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "xlsx":
      case "xls":
      case "csv":
        return <Table className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.join(", ")} up to {maxSize}MB
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            accept={accept.map((ext) => `.${ext}`).join(",")}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Files to upload ({files.length})</span>
            <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload All"}
            </Button>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      )}

      {uploadedFiles.length > 0 && showPreview && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10">
                  Uploaded
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// File Preview Component
// ============================================

interface FilePreviewProps {
  url: string;
  fileName: string;
  onDelete?: () => void;
}

export function FilePreview({ url, fileName, onDelete }: FilePreviewProps) {
  const getFileIcon = () => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "xlsx":
      case "xls":
      case "csv":
        return <Table className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {getFileIcon()}
          <div>
            <p className="font-medium truncate max-w-[200px]">{fileName}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold-500 hover:text-gold-400"
            >
              View File
            </a>
          </div>
        </div>
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Assignment Submission Component
// ============================================

interface AssignmentSubmissionProps {
  assignmentId: string;
  onSubmitComplete?: () => void;
}

export function AssignmentSubmission({ assignmentId, onSubmitComplete }: AssignmentSubmissionProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const { user } = useAuthStore();

  const handleUploadComplete = (url: string) => {
    setFileUrl(url);
  };

  const handleSubmit = async () => {
    if (!fileUrl && !content.trim()) {
      toast({
        title: "Error",
        description: "Please upload a file or enter content",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        assignment_id: assignmentId,
        student_id: user?.id,
        file_url: fileUrl,
        content: content.trim(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
        variant: "default",
      });

      onSubmitComplete?.();
      setFileUrl(null);
      setContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Submission failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit Assignment</CardTitle>
        <CardDescription>Upload your completed assignment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          bucket="submissions"
          folder={`assignments/${assignmentId}`}
          accept={["pdf", "doc", "docx", "xlsx", "xls", "csv"]}
          maxSize={20}
          onUploadComplete={handleUploadComplete}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Or enter your answer</label>
          <textarea
            className="w-full h-32 p-3 rounded-lg border border-input bg-background"
            placeholder="Type your answer or paste content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
          />
        </div>

        <Button
          className="w-full gold"
          onClick={handleSubmit}
          disabled={submitting || (!fileUrl && !content.trim())}
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </Button>
      </CardContent>
    </Card>
  );
}
