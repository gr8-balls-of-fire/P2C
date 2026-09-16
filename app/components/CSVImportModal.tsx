'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface CSVImportModalProps {
  ventureId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({
  ventureId,
  onClose,
  onSuccess,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'text/csv' || f?.name.endsWith('.csv')) {
      setFile(f);
      setError(null);
    } else {
      setError('Please select a CSV file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const importResult = await api.contacts.import(ventureId, file);
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Import Complete
          </h2>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Created:</span>
              <span className="font-semibold text-green-600">{result.created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Skipped:</span>
              <span className="font-semibold text-yellow-600">{result.skipped}</span>
            </div>
            {result.errors?.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Errors:</span>
                <span className="font-semibold text-red-600">{result.errors.length}</span>
              </div>
            )}
          </div>

          {result.errors?.length > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm mb-2">
                Errors:
              </h3>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                {result.errors.map((err: any, i: number) => (
                  <li key={i}>
                    Row {err.row}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onSuccess}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
            >
              Done
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Import Contacts from CSV
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">
              CSV Format
            </label>
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm text-slate-700 dark:text-slate-300 font-mono mb-4">
              firstName,lastName,email,company,title,linkedinUrl,source,notes
            </div>

            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
              Select File <span className="text-red-600">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              >
                {file ? (
                  <>
                    <div className="text-green-600 dark:text-green-400">✓ {file.name}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📁</div>
                    <div>Click to select CSV file</div>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
            >
              {loading ? 'Importing...' : 'Import'}
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
