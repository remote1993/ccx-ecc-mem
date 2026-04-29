import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { authFetch } from '../utils/api';
import type { ViewerCapabilitiesResponse } from '../types';

const emptyCapabilities: ViewerCapabilitiesResponse = {
  defaultProfile: 'core',
  defaultLocale: 'zh-CN',
  capabilitiesByStatus: { active: [], optional: [], reference: [], archived: [] },
  dependencySummary: { core: 0, optional: 0, heavy: 0, external: 0 },
};

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<ViewerCapabilitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(API_ENDPOINTS.VIEWER_CAPABILITIES)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Failed to load viewer capabilities (${res.status}) ${body}`.trim());
        }
        return res.json() as Promise<ViewerCapabilitiesResponse>;
      })
      .then((data) => {
        setError(null);
        setCapabilities({ ...emptyCapabilities, ...data });
      })
      .catch((error) => {
        console.error('Failed to load viewer capabilities:', error);
        setError('能力清单加载失败。请重新构建或安装插件以生成 plugin/fusion/active-view.json。');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { capabilities, isLoading, error };
}
