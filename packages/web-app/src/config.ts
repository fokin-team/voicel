export const MODE = import.meta.env.MODE as 'development' | 'production' | 'staging';

export const URL_BASE = import.meta.env.VITE_API_BASE_DOMAIN;

export const URL_WS = MODE === 'development'
  ? `ws://${URL_BASE}:8080`
  : `wss://${URL_BASE}/ws`;

export const URL_REST = MODE === 'development'
  ? `https://${URL_BASE}:3000`
  : `https://${URL_BASE}`;

export const API_VERSION = 'v1';
