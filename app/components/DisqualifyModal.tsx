'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface DisqualifyModalProps {
  contactId: string;
  ventureId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  'Bad fit for venture',
  'Duplicate contact',
  'No valid contact info',
  'Not interested',
  'Budget constraints',
  'Wrong industry',
  'Other',
];

export default function DisqualifyModal({
  contactId,
  ventureId,
  onClose,
  onSuccess,
}: DisqualifyModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason : reason;

    if (!finalReason) {
      setError('Please select or enter a reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.contacts.disqualify(ventureId, contactId, finalReason);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disqualify contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Disqualify Contact
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
          This will move the contact to Dormant status.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
              Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Explain
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please explain why you're disqualifying this contact"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Disqualifying...' : 'Disqualify'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
