"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Tag as TagIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createList,
  updateList,
  deleteList,
  createLabel,
  updateLabel,
  deleteLabel,
} from "@/app/actions";
import { LIST_COLORS } from "@/types";
import type { List, Label } from "@/types";

const COMMON_EMOJIS = [
  "📥", "📋", "💼", "🏠", "🎯", "🚀", "💡", "⭐", "🔥", "📚",
  "✨", "🛒", "✈️", "💪", "🎨", "🎵", "🍎", "⚡", "🌱", "🎁",
  "📞", "✅", "⏰", "📝", "🔑", "💰", "🎓", "🏆", "❤️", "🌍",
];

interface ListManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lists: List[];
}

export function ListManagerDialog({ isOpen, onClose, lists }: ListManagerDialogProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📋");
  const [color, setColor] = useState(LIST_COLORS[7]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmoji("📋");
      setColor(LIST_COLORS[7]);
      setEditingId(null);
      setPendingDelete(null);
    }
  }, [isOpen]);

  const startEdit = useCallback((list: List) => {
    setEditingId(list.id);
    setName(list.name);
    setEmoji(list.emoji ?? "📋");
    setColor(list.color ?? LIST_COLORS[7]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setName("");
    setEmoji("📋");
    setColor(LIST_COLORS[7]);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        showToast("List name is required", "error");
        return;
      }
      setBusy(true);
      try {
        if (editingId) {
          await updateList(editingId, { name: trimmed, emoji, color });
          showToast(`Updated "${trimmed}"`, "success");
        } else {
          await createList({ name: trimmed, emoji, color });
          showToast(`Created "${trimmed}"`, "success");
        }
        cancelEdit();
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to save list", "error");
      } finally {
        setBusy(false);
      }
    },
    [name, emoji, color, editingId, showToast, cancelEdit, router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await deleteList(id);
        setPendingDelete(null);
        showToast("List deleted", "success");
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to delete list", "error");
      } finally {
        setBusy(false);
      }
    },
    [showToast, router]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-50 w-full max-w-lg rounded-xl border bg-card dark:bg-[#141415] shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                Manage Lists
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organize your tasks into lists
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg bg-muted/40 border mb-4">
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                className="flex-1"
                autoFocus
                maxLength={50}
              />
              <Button type="submit" disabled={busy || !name.trim()}>
                {editingId ? "Save" : "Add"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-7 w-7 rounded-md text-base transition-transform hover:scale-110",
                    emoji === e
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "hover:bg-accent"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform hover:scale-110",
                    color === c && "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </form>

          <div className="space-y-1.5">
            {lists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No lists yet. Create your first one above.
              </p>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  className="group flex items-center gap-2 p-2.5 rounded-lg border bg-background/60 hover:bg-accent/40 transition-colors"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color || "#6b7280" }}
                  />
                  <span className="text-sm">{list.emoji}</span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {list.name}
                    {list.isDefault && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Default
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(list)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors"
                      aria-label={`Edit ${list.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!list.isDefault && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(list.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        aria-label={`Delete ${list.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <AnimatePresence>
            {pendingDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setPendingDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-card border rounded-xl p-6 max-w-sm w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-base font-semibold mb-2">Delete this list?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tasks in this list will be moved to Inbox.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(pendingDelete)}
                      disabled={busy}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface LabelManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
}

export function LabelManagerDialog({ isOpen, onClose, labels }: LabelManagerDialogProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState(LIST_COLORS[9]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmoji("🏷️");
      setColor(LIST_COLORS[9]);
      setEditingId(null);
      setPendingDelete(null);
    }
  }, [isOpen]);

  const startEdit = useCallback((label: Label) => {
    setEditingId(label.id);
    setName(label.name);
    setEmoji(label.emoji ?? "🏷️");
    setColor(label.color ?? LIST_COLORS[9]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setName("");
    setEmoji("🏷️");
    setColor(LIST_COLORS[9]);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        showToast("Label name is required", "error");
        return;
      }
      setBusy(true);
      try {
        if (editingId) {
          await updateLabel(editingId, { name: trimmed, emoji, color });
          showToast(`Updated "${trimmed}"`, "success");
        } else {
          await createLabel({ name: trimmed, emoji, color });
          showToast(`Created "${trimmed}"`, "success");
        }
        cancelEdit();
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to save label", "error");
      } finally {
        setBusy(false);
      }
    },
    [name, emoji, color, editingId, showToast, cancelEdit, router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await deleteLabel(id);
        setPendingDelete(null);
        showToast("Label deleted", "success");
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to delete label", "error");
      } finally {
        setBusy(false);
      }
    },
    [showToast, router]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-50 w-full max-w-lg rounded-xl border bg-card dark:bg-[#141415] shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                Manage Labels
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Color-code your tasks with labels
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg bg-muted/40 border mb-4">
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Label name"
                className="flex-1"
                autoFocus
                maxLength={30}
              />
              <Button type="submit" disabled={busy || !name.trim()}>
                {editingId ? "Save" : "Add"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-7 w-7 rounded-md text-base transition-transform hover:scale-110",
                    emoji === e
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "hover:bg-accent"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform hover:scale-110",
                    color === c && "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            {name.trim() && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground mr-2">Preview:</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${color}25`,
                    color,
                    borderWidth: 1,
                    borderColor: `${color}50`,
                  }}
                >
                  {emoji} {name.trim()}
                </span>
              </div>
            )}
          </form>

          <div className="space-y-1.5">
            {labels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No labels yet. Create your first one above.
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="group flex items-center gap-2 p-2.5 rounded-lg border bg-background/60 hover:bg-accent/40 transition-colors"
                >
                  <TagIcon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: label.color || "#6b7280" }}
                  />
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: label.color ? `${label.color}25` : undefined,
                      color: label.color || undefined,
                    }}
                  >
                    {label.emoji} {label.name}
                  </span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(label)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors"
                      aria-label={`Edit ${label.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(label.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                      aria-label={`Delete ${label.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <AnimatePresence>
            {pendingDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setPendingDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-card border rounded-xl p-6 max-w-sm w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-base font-semibold mb-2">Delete this label?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    It will be removed from any tasks using it.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(pendingDelete)}
                      disabled={busy}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
