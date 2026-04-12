import type { IoTNode, RouterStatus } from '../types';
import { apiClient } from './api';

export const iotNodeService = {
  getAll: async (): Promise<IoTNode[]> => {
    return apiClient.get<IoTNode[]>('/iot-nodes');
  },

  getById: async (id: string): Promise<IoTNode> => {
    return apiClient.get<IoTNode>(`/iot-nodes/${id}`);
  },

  getRouterStatus: async (iotNodeId: string): Promise<RouterStatus> => {
    return apiClient.get<RouterStatus>(`/iot-nodes/${iotNodeId}/status`);
  },
};
