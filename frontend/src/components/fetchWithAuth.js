const apiUrl = import.meta.env.VITE_API_URL || '';

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/clientes?message=' + encodeURIComponent('Sesión expirada. Iniciá sesión nuevamente.');
    throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
  }

  if (response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/clientes?message=' + encodeURIComponent('Tu cuenta está desactivada por un administrador.');
    throw new Error('Tu cuenta está desactivada por un administrador.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ocurrió un error en la solicitud.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}
