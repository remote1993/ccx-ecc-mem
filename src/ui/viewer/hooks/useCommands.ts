import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { authFetch } from '../utils/api';
import type { ViewerCommandsResponse } from '../types';

const emptyCommands: ViewerCommandsResponse = {
  catalog: [],
  history: [],
  summary: {
    catalogCount: 0,
    recommendedCount: 0,
    recordedCount: 0,
    bySource: {},
  },
};

export function useCommands() {
  const [commands, setCommands] = useState<ViewerCommandsResponse>(emptyCommands);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(API_ENDPOINTS.VIEWER_COMMANDS)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Failed to load viewer commands (${res.status}) ${body}`.trim());
        }
        return res.json() as Promise<ViewerCommandsResponse>;
      })
      .then((data) => {
        setError(null);
        setCommands({
          ...emptyCommands,
          ...data,
          summary: { ...emptyCommands.summary, ...(data.summary ?? {}) },
        });
      })
      .catch((error) => {
        console.error('Failed to load viewer commands:', error);
        setError('命令记录加载失败。请确认 worker 正常运行并且数据库已初始化。');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { commands, isLoading, error };
}
