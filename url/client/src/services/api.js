/**
 * API client helper to interact with the backend service.
 * Standard requests are proxy routed through Vite server (port 5173 -> 5000).
 */
const API_BASE = '/api/urls';

export const api = {
  // Fetch all shortened URLs
  async fetchUrls() {
    const response = await fetch(API_BASE);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch URLs');
    }
    return result.data;
  },

  // Create a new shortened URL
  async createUrl(originalUrl, customCode) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalUrl, customCode }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create short URL');
    }
    return result.data;
  },

  // Delete a short URL
  async deleteUrl(code) {
    const response = await fetch(`${API_BASE}/${code}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete URL');
    }
    return result;
  },
};
export default api;
