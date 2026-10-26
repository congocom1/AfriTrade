import LegacySelect from '@/components/ui/legacy-select';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

const PRIORITY_STYLE = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-amber-100 text-amber-900 border-amber-300',
  normal: 'bg-secondary text-foreground border-border',
};

export default function LaunchTaskRow({ task, onStatus, onDelete }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{task.title}</p>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={t('launch.board.delete')}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {task.detail && (
        <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{task.detail}</p>
      )}
      {task.evidence && (
        <p className="mt-1 text-[11px] italic text-muted-foreground">{task.evidence}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.normal
          }`}
        >
          {t(`launch.priority.${task.priority}`)}
        </span>
        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px]">
          {t(`launch.track.${task.track}`)}
        </span>
        {task.area && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {task.area}
          </span>
        )}
        <LegacySelect
          value={task.status}
          onChange={(event) => onStatus(task, event.target.value)}
          aria-label={t('launch.board.status')}
          className="ml-auto h-7 rounded-full border border-border bg-background px-2 text-[11px]"
        >
          {['todo', 'in_progress', 'blocked', 'done'].map((status) => (
            <option key={status} value={status}>
              {t(`launch.status.${status}`)}
            </option>
          ))}
        </LegacySelect>
      </div>
    </div>
  );
}