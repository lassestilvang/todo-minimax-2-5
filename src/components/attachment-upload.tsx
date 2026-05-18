"use client";

import React, { useCallback, useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadAttachments } from "@/app/actions";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface AttachmentUploadProps {
  taskId: string;
  onUploadComplete?: () => void;
  onError?: (error: string) => void;
}

function AttachmentUploadComponent({
  taskId,
  onUploadComplete,
  onError,
}: AttachmentUploadProps) {
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    setError(null);

    const newAttachments: AttachmentInfo[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        onError?.(`File "${file.name}" exceeds 10MB limit`);
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      newAttachments.push({ file, preview, id });
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, [onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [handleFiles]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleUpload = async () => {
    if (attachments.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      attachments.forEach((att) => {
        formData.append("files", att.file);
      });

      await uploadAttachments(taskId, formData);

      setProgress(100);
      onUploadComplete?.();
      setAttachments([]);
      setProgress(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...{ onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        {isDragOver ? (
          <p className="text-sm text-primary">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm font-medium">
              Drag & drop files here, or click to select
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max 10MB per file. Images, PDFs, and documents supported.
            </p>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {attachment.preview ? (
                  <div className="relative h-12 w-12 rounded overflow-hidden">
                    <Image
                      src={attachment.preview}
                      alt={attachment.file.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <File className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(attachment.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {attachments.length > 0 && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Upload {attachments.length} file{attachments.length > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}

export function AttachmentUpload(props: AttachmentUploadProps) {
  return <AttachmentUploadComponent {...props} />;
}
