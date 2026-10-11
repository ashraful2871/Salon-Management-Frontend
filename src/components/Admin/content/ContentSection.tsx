"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasonDialog, type ReasonCode } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { reasonText } from "@/components/Admin/users/labels";
import { SaveBar } from "@/components/Shared/SaveBar";
import { showResultToast } from "@/components/Shared/showResultToast";
import { updateSetting, type SavedSetting } from "@/services/admin/settings/updateSetting";
import type { ContentKey, ContentSetting, ContentValues } from "@/services/admin/content/types";

export const CONTENT_REASONS: ReasonCode[] = [
  { value: "CAMPAIGN", label: "Campaign or promotion" },
  { value: "REFRESH", label: "Content refresh" },
  { value: "FIX", label: "Fixing a mistake" },
  { value: "OTHER", label: "Other" },
];

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Moves item `i` by `by` places; out of range is a no-op. */
export const move = <T,>(list: T[], i: number, by: -1 | 1): T[] => {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/** Up / down / remove for one row of an ordered list. Buttons, so keyboard reachable. */
export function RowControls({
  index,
  count,
  label,
  disabled,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  disabled: boolean;
  onMove: (by: -1 | 1) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${label} up`}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${label} down`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="text-danger" />
        </Button>
      )}
    </div>
  );
}

/**
 * One content setting as a card: its own draft, SaveBar and ReasonDialog.
 * `toValue` turns the draft into what the API takes, or the first problem
 * with it. The parent remounts this on a new version, resetting the draft.
 */
export function ContentSection<K extends ContentKey, D>({
  setting,
  title,
  description,
  toDraft,
  toValue,
  describe,
  children,
}: {
  setting: ContentSetting<K>;
  title: string;
  description: ReactNode;
  toDraft: (value: ContentValues[K]) => D;
  toValue: (draft: D) => { value: ContentValues[K] } | { error: string };
  /** One line for the confirm dialog: what the new value is. */
  describe: (value: ContentValues[K]) => ReactNode;
  children: (draft: D, setDraft: (next: D | ((d: D) => D)) => void) => ReactNode;
}) {
  const [draft, setDraft] = useState<D>(() => toDraft(setting.value));
  const [confirming, setConfirming] = useState(false);
  const formId = useId();

  const parsed = toValue(draft);
  const error = "error" in parsed ? parsed.error : null;
  const dirty = "value" in parsed && !same(parsed.value, setting.value);
  const touched = !same(draft, toDraft(setting.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {setting.updatedAt && <> Last changed {formatDhaka(setting.updatedAt)}.</>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty) setConfirming(true);
          }}
        >
          {children(draft, setDraft)}
        </form>
        {touched && error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <SaveBar
          show={dirty || (touched && Boolean(error))}
          message={error && touched ? "Fix the highlighted problem" : "Unsaved changes"}
          form={formId}
          disabled={!dirty}
          onDiscard={() => setDraft(toDraft(setting.value))}
          className="mt-4"
        />
      </CardContent>

      {confirming && "value" in parsed && (
        <ReasonDialog<SavedSetting>
          open
          onOpenChange={setConfirming}
          title={`Save ${title.toLowerCase()}`}
          description={describe(parsed.value)}
          reasonCodes={CONTENT_REASONS}
          confirmLabel="Save"
          showNotify={false}
          onConfirm={(input) =>
            updateSetting(setting.key, parsed.value, reasonText(CONTENT_REASONS, input))
          }
          onDone={(result) => showResultToast(result)}
        />
      )}
    </Card>
  );
}
