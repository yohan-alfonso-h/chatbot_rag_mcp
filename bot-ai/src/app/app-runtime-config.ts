import { InjectionToken } from '@angular/core';

export interface AppRuntimeConfig {
  apiUrl: string;
}

const DEFAULT_RUNTIME_CONFIG: AppRuntimeConfig = {
  apiUrl: '/api/chat',
};

export const APP_RUNTIME_CONFIG = new InjectionToken<AppRuntimeConfig>(
  'APP_RUNTIME_CONFIG',
);

export async function loadRuntimeConfig(): Promise<AppRuntimeConfig> {
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });

    if (!response.ok) {
      return DEFAULT_RUNTIME_CONFIG;
    }

    const config = (await response.json()) as Partial<AppRuntimeConfig>;

    return {
      apiUrl: getConfigValue(config.apiUrl, DEFAULT_RUNTIME_CONFIG.apiUrl),
    };
  } catch {
    return DEFAULT_RUNTIME_CONFIG;
  }
}

function getConfigValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}
