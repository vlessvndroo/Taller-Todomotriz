// URL base del backend. Se puede sobrescribir con la variable VITE_API_URL en frontend/.env
export const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
