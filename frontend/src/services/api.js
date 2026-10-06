/**
 * API Service Layer
 * Handles all HTTP requests to the Flask backend.
 */

const API_BASE = `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '')}/api`;

async function fetchApi(path, options = {}) {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch (error) {
    if (error instanceof TypeError || error.message === 'Failed to fetch') {
      throw new Error('Backend server is not running. Please start the backend and check VITE_API_URL.');
    }
    throw error;
  }
}

async function request(url, options = {}) {
  try {
    const response = await fetchApi(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ==================== CANDIDATES ====================
export const candidateAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/candidates${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/candidates/${id}`),
  update: (id, data) => request(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  shortlist: (id) => request(`/candidates/${id}/shortlist`, { method: 'POST' }),
  reject: (id) => request(`/candidates/${id}/reject`, { method: 'POST' }),
  updateStatus: (id, status) => request(`/candidates/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  clearAll: () => request('/candidates', {
    method: 'DELETE',
    headers: { 'X-Role': 'admin' },
  }),
};

// ==================== RESUMES ====================
export const resumeAPI = {
  upload: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return fetchApi('/resumes/upload', {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      return res.json();
    });
  },
};

// ==================== JOBS ====================
export const jobAPI = {
  getAll: () => request('/jobs'),
  getById: (id) => request(`/jobs/${id}`),
  create: (data) => request('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  rank: (id) => request(`/jobs/${id}/rank`, { method: 'POST' }),
  getRankings: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs/${id}/rankings${query ? `?${query}` : ''}`);
  },
};

// ==================== SEARCH ====================
export const searchAPI = {
  skills: (q) => request(`/search/skills?q=${encodeURIComponent(q || '')}`),
  candidates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/search/candidates?${query}`);
  },
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  get: () => request('/analytics'),
};

// ==================== DSA ====================
export const dsaAPI = {
  getHashTable: () => request('/dsa/hash-table'),
  searchHashTable: (key) => request(`/dsa/hash-table/search?key=${encodeURIComponent(key)}`),
  getTrie: (prefix) => request(`/dsa/trie?prefix=${encodeURIComponent(prefix || '')}`),
  trieAutocomplete: (prefix) => request(`/dsa/trie/autocomplete?prefix=${encodeURIComponent(prefix)}`),
  getGraph: () => request('/dsa/graph'),
  mergeSortViz: (data) => request('/dsa/merge-sort', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),
  getMaxHeap: () => request('/dsa/max-heap'),
  maxHeapTopK: (k) => request(`/dsa/max-heap/top-k?k=${k}`),
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  get: () => request('/settings'),
  update: (data) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  addSkill: (skill) => request('/settings/skills', {
    method: 'POST',
    body: JSON.stringify({ skill }),
  }),
  removeSkill: (skill) => request('/settings/skills', {
    method: 'DELETE',
    body: JSON.stringify({ skill }),
  }),
};

// ==================== OPTIMIZATION (DSA UNIT 3 & 4) ====================
export const optimizationAPI = {
  knapsack: (data) => request('/optimization/knapsack', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  branchBound: (data) => request('/optimization/branch-bound', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==================== HEALTH ====================
export const healthAPI = {
  check: () => request('/health'),
};
