import type { IoTNode, RouterStatus } from '../types';
import { apiClient } from './api';
import { buildMockRouterStatus, mockIoTNodes } from '../mock-data/data';

const USE_MOCK = true;

export const iotNodeService = {
  getAll: async (): Promise<IoTNode[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return [...mockIoTNodes];
    }
    return apiClient.get<IoTNode[]>('/iot-nodes');
  },

  getById: async (id: string): Promise<IoTNode> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const n = mockIoTNodes.find((x) => x.id === id);
      if (!n) throw new Error('IoT mazgas nerastas');
      return n;
    }
    return apiClient.get<IoTNode>(`/iot-nodes/${id}`);
  },

  getRouterStatus: async (iotNodeId: string): Promise<RouterStatus> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return buildMockRouterStatus(iotNodeId);
    }
    return apiClient.get<RouterStatus>(`/iot-nodes/${iotNodeId}/status`);
  },
};
