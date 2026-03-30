// Base API configuration
// When integrating with ASP.NET Core backend, change this URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Simulated network delay for mock data
const MOCK_DELAY = 500;

export const simulateDelay = (ms = MOCK_DELAY) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Future: Replace with real fetch calls
export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    await simulateDelay();
    // Future implementation:
    // const response = await fetch(`${API_BASE_URL}${endpoint}`);
    // if (!response.ok) throw new Error(response.statusText);
    // return response.json();
    throw new Error(`GET ${API_BASE_URL}${endpoint} - Not connected to backend`);
  },

  post: async <T>(endpoint: string, _data: unknown): Promise<T> => {
    await simulateDelay();
    throw new Error(`POST ${API_BASE_URL}${endpoint} - Not connected to backend`);
  },

  put: async <T>(endpoint: string, _data: unknown): Promise<T> => {
    await simulateDelay();
    throw new Error(`PUT ${API_BASE_URL}${endpoint} - Not connected to backend`);
  },

  delete: async (endpoint: string): Promise<void> => {
    await simulateDelay();
    throw new Error(`DELETE ${API_BASE_URL}${endpoint} - Not connected to backend`);
  },
};
