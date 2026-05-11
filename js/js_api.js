/* ============================================================
   js_api.js — Asthma Space · Camada de comunicação com o backend
   ============================================================
   Troque API_BASE pela URL do Render quando for para produção.
   ============================================================ */

export const API_BASE = 'https://asmatchspace.onrender.com';

// ── Helpers de token ──────────────────────────────────────────
export function getToken()  { return sessionStorage.getItem('as_token'); }
export function getRole()   { return sessionStorage.getItem('as_role');  }

export function saveSession(token, role) {
  sessionStorage.setItem('as_token', token);
  sessionStorage.setItem('as_role',  role);
}

export function clearSession() {
  sessionStorage.removeItem('as_token');
  sessionStorage.removeItem('as_role');
  localStorage.removeItem('as_remember_email');
}

// ── Fetch autenticado ─────────────────────────────────────────
async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.erro || `Erro ${res.status}`);
  }

  // 204 No Content → não tem body
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email, senha) {
  return authFetch('/login', {
    method: 'POST',
    // backend espera { login, senha } — campo login é o e-mail
    body: JSON.stringify({ login: email, senha }),
  });
}

export async function recuperarSenha(email) {
  return authFetch('/auth/recuperar-senha', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ── Clientes (Admin) ──────────────────────────────────────────
export async function listarClientes() {
  // retorna Page<DadosDetalhamentoAdmin> — use .content no caller
  return authFetch('/clientes/listagem');
}

export async function atualizarCliente(id, payload) {
  return authFetch(`/clientes/atualizar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function inativarCliente(id) {
  return authFetch(`/clientes/inativar/${id}`, {
    method: 'DELETE',
  });
}