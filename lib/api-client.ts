const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-key-change-me';

async function apiCall(
  path: string,
  options: RequestInit = {}
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
    ...options.headers,
  };

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  ventures: {
    list: () => apiCall('/ventures'),
    create: (data: { name: string; icpNotes?: string }) =>
      apiCall('/ventures', { method: 'POST', body: JSON.stringify(data) }),
  },
  contacts: {
    list: (ventureId: string, params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/ventures/${ventureId}/contacts${query ? `?${query}` : ''}`);
    },
    get: (ventureId: string, contactId: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}`),
    create: (ventureId: string, data: any) =>
      apiCall(`/ventures/${ventureId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (ventureId: string, contactId: string, data: any) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    requalify: (ventureId: string, contactId: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/requalify`, {
        method: 'POST',
      }),
    disqualify: (ventureId: string, contactId: string, reason: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/disqualify`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    moveToStage: (ventureId: string, contactId: string, stageName: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/move-to-stage`, {
        method: 'POST',
        body: JSON.stringify({ stageName }),
      }),
    verifyEmail: (ventureId: string, contactId: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/verify-email`, {
        method: 'POST',
      }),
    import: async (ventureId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(
        `/api/ventures/${ventureId}/contacts/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
          body: formData,
        }
      );
      if (!response.ok) {
        throw new Error('Import failed');
      }
      return response.json();
    },
  },
  campaigns: {
    list: (ventureId: string) =>
      apiCall(`/ventures/${ventureId}/campaigns`),
    create: (ventureId: string, data: { name: string; description?: string; stages?: string[] }) =>
      apiCall(`/ventures/${ventureId}/campaigns`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addStage: (ventureId: string, campaignId: string, data: { name: string; order?: number }) =>
      apiCall(`/ventures/${ventureId}/campaigns/${campaignId}/stages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listStages: (ventureId: string, campaignId: string) =>
      apiCall(`/ventures/${ventureId}/campaigns/${campaignId}/stages`),
  },
  tasks: {
    list: (ventureId: string, params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/ventures/${ventureId}/tasks${query ? `?${query}` : ''}`);
    },
    create: (ventureId: string, data: any) =>
      apiCall(`/ventures/${ventureId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    complete: (ventureId: string, taskId: string, notes?: string) =>
      apiCall(`/ventures/${ventureId}/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    skip: (ventureId: string, taskId: string, reason?: string) =>
      apiCall(`/ventures/${ventureId}/tasks/${taskId}/skip`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },
  pipeline: {
    getView: (ventureId: string) =>
      apiCall(`/ventures/${ventureId}/pipeline`),
    engage: (ventureId: string, contactId: string, reason?: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/engage`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    advanceToOpportunity: (ventureId: string, contactId: string, reason?: string) =>
      apiCall(`/ventures/${ventureId}/contacts/${contactId}/advance-to-opportunity`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    identifyDormant: (ventureId: string) =>
      apiCall(`/ventures/${ventureId}/dormancy/identify`, {
        method: 'POST',
      }),
    markDormant: (ventureId: string, contactIds: string[]) =>
      apiCall(`/ventures/${ventureId}/dormancy/mark`, {
        method: 'POST',
        body: JSON.stringify({ contactIds }),
      }),
  },
};
