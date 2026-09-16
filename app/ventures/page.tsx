'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Venture {
  id: string;
  name: string;
  icpNotes?: string;
  createdAt: string;
}

export default function VenturesPage() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', icpNotes: '' });

  useEffect(() => {
    loadVentures();
  }, []);

  const loadVentures = async () => {
    try {
      setLoading(true);
      const data = await api.ventures.list();
      setVentures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ventures');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.ventures.create(formData);
      setFormData({ name: '', icpNotes: '' });
      setShowForm(false);
      loadVentures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create venture');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Ventures</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your sales ventures</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 transition"
          >
            {showForm ? 'Cancel' : '+ New Venture'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                Venture Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                ICP Notes (optional)
              </label>
              <textarea
                value={formData.icpNotes}
                onChange={(e) => setFormData({ ...formData, icpNotes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
            >
              Create Venture
            </button>
          </form>
        )}

        <div className="grid gap-4">
          {ventures.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              No ventures yet. Create one to get started.
            </div>
          ) : (
            ventures.map((venture) => (
              <Link
                key={venture.id}
                href={`/ventures/${venture.id}`}
                className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {venture.name}
                </h2>
                {venture.icpNotes && (
                  <p className="text-slate-600 dark:text-slate-400 mt-2">{venture.icpNotes}</p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-3">
                  Created {new Date(venture.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
