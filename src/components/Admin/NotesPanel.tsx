"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getAdminNotes } from "@/services/admin/notes/getAdminNotes";
import { createAdminNote } from "@/services/admin/notes/createAdminNote";
import { deleteAdminNote } from "@/services/admin/notes/deleteAdminNote";
import type { AdminNote, AdminNoteEntity } from "@/services/admin/types";
import { formatDhaka } from "./Timeline";
import { useClock } from "./useClock";

/** The API lets an author delete their own note for this long. */
const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Internal notes on one entity (`/admin/notes`): staff-only context such as
 * "called the owner, refund agreed". Loads when it mounts, adds at the top,
 * and lets the author remove their own note for 24 h.
 */
export function NotesPanel({
  entityType,
  entityId,
  currentUserId,
}: {
  entityType: AdminNoteEntity;
  entityId: string;
  /** The viewer's user id, to offer delete on their own recent notes. */
  currentUserId?: string;
}) {
  const ids = useId();
  const now = useClock();
  const [notes, setNotes] = useState<AdminNote[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getAdminNotes(entityType, entityId).then((result) => {
      if (!live) return;
      if (result.success) setNotes(result.data ?? []);
      else setLoadError(result.message);
    });
    return () => {
      live = false;
    };
  }, [entityType, entityId]);

  const add = () => {
    const text = body.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const result = await createAdminNote({ entityType, entityId, body: text, pinned });
      if (!result.success || !result.data) {
        setError(result.message);
        return;
      }
      const note = { ...result.data, authorName: result.data.authorName ?? "You" };
      setNotes((list) => [note, ...(list ?? [])]);
      setBody("");
      setPinned(false);
    });
  };

  const remove = (id: string) => {
    setRemoving(id);
    startTransition(async () => {
      const result = await deleteAdminNote(id);
      setRemoving(null);
      if (result.success) setNotes((list) => (list ?? []).filter((n) => n.id !== id));
      else setError(result.message);
    });
  };

  const sorted = [...(notes ?? [])].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <Card className="gap-3">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Internal notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="space-y-2">
          <label htmlFor={`${ids}-body`} className="sr-only">
            New note
          </label>
          <Textarea
            id={`${ids}-body`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Add a note for the team (never shown to them)"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              Pin to top
            </label>
            <Button type="button" size="sm" onClick={add} disabled={!body.trim() || pending}>
              {pending && !removing && <Loader2 aria-hidden="true" className="animate-spin" />}
              Add note
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        {loadError ? (
          <p role="alert" className="text-sm text-danger">
            Couldn&apos;t load notes: {loadError}
          </p>
        ) : notes === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Loading notes…
          </p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((note) => {
              const canDelete =
                !!currentUserId &&
                note.authorId === currentUserId &&
                now !== null &&
                now - new Date(note.createdAt).getTime() < DELETE_WINDOW_MS;
              return (
                <li key={note.id} className="py-3 text-sm">
                  <p className="break-words whitespace-pre-wrap">{note.body}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {note.pinned && (
                      <span className="inline-flex items-center gap-1 font-medium text-primary-hover">
                        <Pin aria-hidden="true" className="size-3" />
                        Pinned
                      </span>
                    )}
                    <span>{note.authorName ?? "Unknown"}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={note.createdAt}>{formatDhaka(note.createdAt)}</time>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-muted-foreground"
                        onClick={() => remove(note.id)}
                        disabled={removing === note.id}
                        aria-label="Delete this note"
                      >
                        {removing === note.id ? (
                          <Loader2 aria-hidden="true" className="animate-spin" />
                        ) : (
                          <Trash2 aria-hidden="true" />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
