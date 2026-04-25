import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { authFetch } from '../utils/api';
import type { ViewerIntegrationsResponse } from '../types';

export function useViewerIntegrations() {
  const [integrations, setIntegrations] = useState<string[]>([]);

  useEffect(() => {
    authFetch(API_ENDPOINTS.VIEWER_INTEGRATIONS)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load viewer integrations (${res.status})`);
        }
        return res.json() as Promise<ViewerIntegrationsResponse>;
      })
      .then((data) => {
        setIntegrations(Array.isArray(data.integrations) ? data.integrations : []);
      })
      .catch((error) => {
        console.error('Failed to load viewer integrations:', error);
      });
  }, []);

  return { integrations };
}
