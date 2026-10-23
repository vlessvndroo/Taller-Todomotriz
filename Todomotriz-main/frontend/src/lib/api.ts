// URL base del backend. Se puede sobrescribir con la variable VITE_API_URL en frontend/.env
export const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Llama a la API y devuelve el JSON de respuesta.
 * Si la respuesta no es 2xx lanza un Error con el mensaje del backend (cuando lo hay).
 */
export async function api<T = unknown>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const info = (typeof data === 'object' && data ? data : {}) as { message?: string; title?: string };
    const message = info.message || info.title || `Error ${res.status} en ${method} ${path}`;
    throw new Error(message);
  }
  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Extrae un mensaje legible de cualquier error capturado */
export function errorMessage(err: unknown) {
  if (err instanceof TypeError) return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
  return err instanceof Error ? err.message : String(err);
}
