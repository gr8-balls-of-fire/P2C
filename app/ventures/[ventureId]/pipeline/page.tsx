'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface PipelineView {
  [key: string]: {
    count: number;
    avgDaysInStage: number;
  };
}

export default function PipelineViewPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  const [pipeline, setPipeline] = useState<PipelineView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPipeline();
  }, [ventureId]);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const data = await api.pipeline.getView(ventureId);
      setPipeline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const stageConfig = [
    { key: 'PROSPECT', label: 'Prospects', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
    { key: 'LEAD', label: 'Leads', color: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
    { key: 'OPPORTUNITY', label: 'Opportunities', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
    { key: 'CUSTOMER', label: 'Customers', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' },
    { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
    { key: 'DORMANT', label: 'Dormant', color: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' },
  ];

  const totalContacts = Object.values(pipeline || {}).reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/ventures/${ventureId}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 block">
            ← Back to Venture
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Pipeline Overview</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Total contacts: <span className="font-semibold">{totalContacts}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Pipeline Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stageConfig.map((stage) => {
            const stageData = pipeline?.[stage.key] || { count: 0, avgDaysInStage: 0 };
            const percentage = totalContacts > 0 ? Math.round((stageData.count / totalContacts) * 100) : 0;

            return (
              <div
                key={stage.key}
                className={`p-6 rounded-lg border-2 ${stage.color}`}
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  {stage.label}
                </h2>

                {/* Count */}
                <div className="mb-4">
                  <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                    {stageData.count}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {percentage}% of pipeline
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        stage.key === 'PROSPECT'
                          ? '#3b82f6'
                          : stage.key === 'LEAD'
                          ? '#10b981'
                          : stage.key === 'OPPORTUNITY'
                          ? '#a855f7'
                          : stage.key === 'CUSTOMER'
                          ? '#eab308'
                          : stage.key === 'CLOSED_LOST'
                          ? '#ef4444'
                          : '#6b7280',
                    }}
                  />
                </div>

                {/* Avg Days */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Avg {stageData.avgDaysInStage} days in stage
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel Chart (simple text representation) */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">
            Conversion Funnel
          </h3>

          <div className="space-y-4">
            {stageConfig.map((stage, idx) => {
              const stageData = pipeline?.[stage.key] || { count: 0 };
              const prospectCount = pipeline?.PROSPECT?.count || 1;
              const conversionRate = prospectCount > 0 ? Math.round((stageData.count / prospectCount) * 100) : 0;

              return (
                <div key={stage.key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {stage.label}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {stageData.count} ({conversionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                      style={{ width: `${conversionRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
