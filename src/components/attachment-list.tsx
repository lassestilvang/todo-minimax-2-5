"use client";

/* eslint-disable react/display-name */
import React, { useState, memo, useMemo } from "react";
import { format } from "date-fns";
import { Download, Trash2, File, Image as ImageIcon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Attachment } from "@/types";

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

function AttachmentListComponent({
  attachments,
  onDelete,
  onDownload,
}: AttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );

  const getFileIcon = useMemo(
    () => (mimeType: string) => {
      if (mimeType.startsWith("image/")) {
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      }
      if (mimeType === "application/pdf") {
        return <FileText className="h-5 w-5 text-red-500" />;
      }
      return <File className="h-5 w-5 text-gray-500" />;
    },
    []
  );

  const formatFileSize = useMemo(
    () => (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
[]
  );

  const handleDownload = useMemo(
    () => (attachment: Attachment) => {
      const link = document.createElement("a");
      link.href = `/api/attachments/${attachment.id}/download`;
      link.download = attachment.filename;
      link.click();
      onDownload?.(attachment.id);
    },
    [onDownload]
  );

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          Attachments ({attachments.length})
        </h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              {attachment.mimeType.startsWith("image/") ? (
                <div
                  className="mb-2 cursor-pointer"
                  onClick={() => setPreviewAttachment(attachment)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/attachments/${attachment.id}/thumbnail`}
                    alt={attachment.filename}
                    className="h-24 w-full rounded object-cover"
                  />
                </div>
              ) : (
                <div className="mb-2 flex h-24 items-center justify-center rounded bg-muted">
                  {getFileIcon(attachment.mimeType)}
                </div>
              )}

              <div className="space-y-1">
                <p
                  className="truncate text-sm font-medium"
                  title={attachment.filename}
                >
                  {attachment.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)} •{" "}
                  {format(new Date(attachment.createdAt), "MMM d")}
                </p>
              </div>

              <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewAttachment(attachment)}
                    title="Preview"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(attachment.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{previewAttachment?.filename}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPreviewAttachment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4 max-h-[70vh] overflow-auto">
            {previewAttachment?.mimeType.startsWith("image/") ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/attachments/${previewAttachment.id}/download`}
                alt={previewAttachment.filename}
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : previewAttachment?.mimeType === "application/pdf" ? (
              <iframe
                src={`/api/attachments/${previewAttachment.id}/download`}
                className="w-full h-[70vh] rounded"
                title={previewAttachment.filename}
              />
            ) : (
              <div className="text-center">
                {getFileIcon(previewAttachment?.mimeType || "")}
                <p className="mt-2 text-muted-foreground">
                  Preview not available
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => previewAttachment && handleDownload(previewAttachment)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

AttachmentListComponent.displayName = "AttachmentList";
export const AttachmentList = memo(AttachmentListComponent);
