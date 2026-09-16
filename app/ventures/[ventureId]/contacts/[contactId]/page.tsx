'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import DisqualifyModal from '@/app/components/DisqualifyModal';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  notes?: string;
  state: string;
  prospectState?: string;
  source?: string;
  createdAt: string;
  stateHistory: Array<{
    id: string;
    fromState: string;
    toState: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showDisqualify, setShowDisqualify] = useState(false);

  useEffect(() => {
    loadContact();
  }, [ventureId, contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await api.contacts.get(ventureId, contactId);
      setContact(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        company: data.company || '',
        title: data.title || '',
        linkedinUrl: data.linkedinUrl || '',
        industry: data.industry || '',
        companySize: data.companySize || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.contacts.update(ventureId, contactId, formData);
      setEditing(false);
      loadContact();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  };

  const handleRequalify = async () => {
    try {
      await api.contacts.requalify(ventureId, contactId);
      loadContact();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to requalify');
    }
  };

  const handleEngage = async () => {
    try {
      await api.pipeline.engage(ventureId, contactId, 'Manual engagement by user');
      loadContact();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to engage contact');
    }
  };

  const handleAdvanceToOpportunity = async () => {
    try {
      await api.pipeline.advanceToOpportunity(ventureId, contactId, 'Manual advancement by user');
      loadContact();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance contact');
    }
  };

  const handleDisqualified = async () => {
    setShowDisqualify(false);
    loadContact();
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!contact) return <div className="flex justify-center items-center h-screen">Contact not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{contact.company}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Contact Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Contact Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        Company Size
                      </label>
                      <input
                        type="text"
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</div>
                      <div className="text-slate-900 dark:text-slate-50">{contact.email || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Title</div>
                      <div className="text-slate-900 dark:text-slate-50">{contact.title || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Industry</div>
                      <div className="text-slate-900 dark:text-slate-50">{contact.industry || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Company Size</div>
                      <div className="text-slate-900 dark:text-slate-50">{contact.companySize || '—'}</div>
                    </div>
                  </div>
                  {contact.linkedinUrl && (
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">LinkedIn</div>
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                  {contact.notes && (
                    <div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes</div>
                      <div className="text-slate-900 dark:text-slate-50">{contact.notes}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">State</div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
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
                </div>
                {contact.prospectState && (
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Prospect Stage</div>
                    <div className="text-slate-900 dark:text-slate-50">{contact.prospectState}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Source</div>
                  <div className="text-slate-900 dark:text-slate-50">{contact.source}</div>
                </div>
              </div>

              <div className="space-y-2 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                {contact.state === 'PROSPECT' && (
                  <>
                    <button
                      onClick={handleRequalify}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Requalify
                    </button>
                    <button
                      onClick={handleEngage}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Engage → Lead
                    </button>
                  </>
                )}
                {contact.state === 'LEAD' && (
                  <button
                    onClick={handleAdvanceToOpportunity}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Advance → Opportunity
                  </button>
                )}
                {(contact.state === 'PROSPECT' || contact.state === 'LEAD') && (
                  <button
                    onClick={() => setShowDisqualify(true)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Disqualify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* State History */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">State History</h2>
          <div className="space-y-3">
            {contact.stateHistory.length === 0 ? (
              <div className="text-slate-600 dark:text-slate-400 text-sm">No history yet</div>
            ) : (
              contact.stateHistory.map((entry) => (
                <div key={entry.id} className="flex gap-4 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-900 dark:text-slate-50">
                      {entry.fromState} → {entry.toState}
                    </div>
                    {entry.reason && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">{entry.reason}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDisqualify && (
        <DisqualifyModal
          contactId={contactId}
          ventureId={ventureId}
          onClose={() => setShowDisqualify(false)}
          onSuccess={handleDisqualified}
        />
      )}
    </div>
  );
}
