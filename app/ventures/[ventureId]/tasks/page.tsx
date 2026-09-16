'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Task {
  id: string;
  action: string;
  status: string;
  priority: number;
  dueAt: string;
  contact: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    state: string;
  };
  notes?: string;
}

export default function TaskQueuePage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    loadTasks();
  }, [ventureId, filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.tasks.list(ventureId, { status: filter });
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await api.tasks.complete(ventureId, taskId);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    }
  };

  const handleSkip = async (taskId: string) => {
    try {
      await api.tasks.skip(ventureId, taskId);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip task');
    }
  };

  const getPriorityLabel = (priority: number) => {
    if (priority < 10) return 'URGENT';
    if (priority < 30) return 'HIGH';
    if (priority < 60) return 'MEDIUM';
    return 'LOW';
  };

  const getPriorityColor = (priority: number) => {
    if (priority < 10) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (priority < 30) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (priority < 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/ventures/${ventureId}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 block">
            ← Back to Venture
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Daily Task Queue</h1>
          <p className="text-slate-600 dark:text-slate-400">Prioritized tasks sorted by urgency</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              No {filter.toLowerCase()} tasks. Great job!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${
                  isOverdue(task.dueAt)
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {task.action.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {isOverdue(task.dueAt) && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/ventures/${ventureId}/contacts/${task.contact.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline block mb-2"
                    >
                      <div className="font-medium">
                        {task.contact.firstName} {task.contact.lastName}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {task.contact.company} • {task.contact.email}
                      </div>
                    </Link>

                    {task.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                      <span>State: {task.contact.state}</span>
                    </div>
                  </div>

                  {task.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium whitespace-nowrap"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleSkip(task.id)}
                        className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-50 text-sm font-medium whitespace-nowrap"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
