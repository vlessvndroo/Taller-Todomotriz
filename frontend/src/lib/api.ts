// URL base del backend. Se puede sobrescribir con la variable VITE_API_URL en frontend/.env
export const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/** Clave de localStorage donde AuthContext guarda la sesión (incluye el token JWT) */
export const SESSION_KEY = 'authUser';

/** Evento que se emite cuando el backend rechaza el token (sesión vencida o inválida) */
export const SESSION_EXPIRED_EVENT = 'todomotriz:session-expired';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function readToken(): string | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as { token?: string }).token ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Llama a la API con el token de la sesión y devuelve el JSON de respuesta.
 * Si la respuesta no es 2xx lanza un Error con el mensaje del backend (cuando lo hay).
 */
export async function api<T = unknown>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    if (res.status === 403) throw new Error('No tienes permiso para realizar esta acción.');
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
