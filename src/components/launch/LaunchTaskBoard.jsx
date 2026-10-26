import LegacySelect from '@/components/ui/legacy-select';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LaunchTaskRow from '@/components/launch/LaunchTaskRow';

const TRACKS = ['all', 'web', 'app', 'shared'];
const STATUSES = ['all', 'todo', 'in_progress', 'blocked', 'done'];

const chipClass = (active) =>
  `rounded-full border px-3 py-1 text-xs ${
    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
  }`;

export default function LaunchTaskBoard() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState('all');
  const [status, setStatus] = useState('all');
  const [title, setTitle] = useState('');
  const [newTrack, setNewTrack] = useState('shared');
  const [newPriority, setNewPriority] = useState('normal');

  const load = async () => {
    const page = await base44.entities.LaunchTask.list({ sort: '-created_date', limit: 200 });
    setTasks(page.items || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    const unsubscribe = base44.entities.LaunchTask.subscribe(() => {
      load().catch(() => {});
    });
    return unsubscribe;
  }, []);

  const changeStatus = async (task, next) => {
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: next } : item)));
    await base44.entities.LaunchTask.update(task.id, {
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : '',
    });
  };

  const remove = async (task) => {
    if (!window.confirm(t('launch.board.confirmDelete'))) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    await base44.entities.LaunchTask.delete(task.id);
  };

  const add = async (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle('');
    await base44.entities.LaunchTask.create({
      title: trimmed,
      track: newTrack,
      priority: newPriority,
      status: 'todo',
      source_agent: 'manual',
    });
    await load();
  };

  const visible = tasks.filter(
    (task) => (track === 'all' || task.track === track) && (status === 'all' || task.status === status)
  );
  const open = tasks.filter((task) => task.status !== 'done').length;
  const critical = tasks.filter((task) => task.priority === 'critical' && task.status !== 'done').length;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">{t('launch.board.title')}</h2>
        <p className="text-xs text-muted-foreground">
          {t('launch.board.counts', { open, critical })}
        </p>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('launch.board.addPlaceholder')}
          className="h-9 min-w-[12rem] flex-1 rounded-full border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <LegacySelect
          value={newTrack}
          onChange={(event) => setNewTrack(event.target.value)}
          aria-label={t('launch.board.track')}
          className="h-9 rounded-full border border-border bg-card px-2 text-xs"
        >
          {['web', 'app', 'shared'].map((value) => (
            <option key={value} value={value}>
              {t(`launch.track.${value}`)}
            </option>
          ))}
        </LegacySelect>
        <LegacySelect
          value={newPriority}
          onChange={(event) => setNewPriority(event.target.value)}
          aria-label={t('launch.board.priority')}
          className="h-9 rounded-full border border-border bg-card px-2 text-xs"
        >
          {['critical', 'high', 'normal'].map((value) => (
            <option key={value} value={value}>
              {t(`launch.priority.${value}`)}
            </option>
          ))}
        </LegacySelect>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {t('launch.board.add')}
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {TRACKS.map((value) => (
          <button key={value} type="button" onClick={() => setTrack(value)} className={chipClass(track === value)}>
            {t(`launch.track.${value}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)} className={chipClass(status === value)}>
            {t(`launch.status.${value}`)}
          </button>
        ))}
      </div>

      <div className="max-h-[46vh] space-y-2 overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-secondary" />
            <div className="h-16 animate-pulse rounded-xl bg-secondary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{t('launch.board.empty')}</p>
        ) : (
          visible.map((task) => (
            <LaunchTaskRow key={task.id} task={task} onStatus={changeStatus} onDelete={remove} />
          ))
        )}
      </div>
    </div>
  );
}