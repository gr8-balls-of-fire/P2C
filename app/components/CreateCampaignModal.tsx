'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface CreateCampaignModalProps {
  ventureId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignModal({
  ventureId,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<string[]>(['Lead Qualified', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Closed Won']);
  const [newStage, setNewStage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddStage = () => {
    if (newStage.trim() && !stages.includes(newStage)) {
      setStages([...stages, newStage]);
      setNewStage('');
    }
  };

  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (stages.length === 0) {
      setError('At least one stage is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.campaigns.create(ventureId, {
        name,
        description: description || undefined,
        stages,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Create Campaign
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
              Campaign Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q4 Enterprise Push"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign details"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
              Sales Stages <span className="text-red-600">*</span>
            </label>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                placeholder="e.g., Proposal Sent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 text-sm"
              />
              <button
                type="button"
                onClick={handleAddStage}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>

            <div className="space-y-1">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-slate-100 dark:bg-slate-700 p-2 rounded"
                >
                  <span className="text-sm text-slate-900 dark:text-slate-50">{stage}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStage(idx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
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
