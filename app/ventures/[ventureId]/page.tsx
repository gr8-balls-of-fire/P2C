'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import NewContactModal from '@/app/components/NewContactModal';
import CSVImportModal from '@/app/components/CSVImportModal';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  state: string;
  prospectState?: string;
  source?: string;
  lastTouchedAt?: string;
}

interface Venture {
  id: string;
  name: string;
  icpNotes?: string;
}

export default function VentureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;

  const [venture, setVenture] = useState<Venture | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [filters, setFilters] = useState({ state: '', prospectState: '' });

  useEffect(() => {
    loadData();
  }, [ventureId, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ventureData = await api.ventures.list();
      const v = Array.isArray(ventureData)
        ? ventureData.find((ven: any) => ven.id === ventureId)
        : null;
      setVenture(v || null);

      const params: any = {};
      if (filters.state) params.state = filters.state;
      if (filters.prospectState) params.prospectState = filters.prospectState;

      const contactsData = await api.contacts.list(ventureId, params);
      setContacts(contactsData.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleContactCreated = () => {
    setShowNewContact(false);
    loadData();
  };

  const handleCSVImported = () => {
    setShowCSVImport(false);
    loadData();
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!venture) return <div className="flex justify-center items-center h-screen">Venture not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/ventures" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 block">
            ← Back to Ventures
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{venture.name}</h1>
          {venture.icpNotes && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">{venture.icpNotes}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowNewContact(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 transition"
          >
            + Add Contact
          </button>
          <button
            onClick={() => setShowCSVImport(true)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 dark:bg-slate-700 dark:text-slate-50 transition"
          >
            📥 Import CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
          >
            <option value="">All States</option>
            <option value="PROSPECT">Prospect</option>
            <option value="LEAD">Lead</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="CUSTOMER">Customer</option>
            <option value="CLOSED_LOST">Closed Lost</option>
            <option value="DORMANT">Dormant</option>
          </select>
        </div>

        {/* Contacts Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              No contacts yet. Add one or import from CSV.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    onClick={() => router.push(`/ventures/${ventureId}/contacts/${contact.id}`)}
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {contact.company}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        contact.state === 'PROSPECT'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : contact.state === 'LEAD'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : contact.state === 'OPPORTUNITY'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : contact.state === 'CUSTOMER'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                        {contact.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {contact.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewContact && (
        <NewContactModal
          ventureId={ventureId}
          onClose={() => setShowNewContact(false)}
          onSuccess={handleContactCreated}
        />
      )}
      {showCSVImport && (
        <CSVImportModal
          ventureId={ventureId}
          onClose={() => setShowCSVImport(false)}
          onSuccess={handleCSVImported}
        />
      )}
    </div>
  );
}
