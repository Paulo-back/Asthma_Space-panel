/* ============================================================
   login.js — Asthma Space · Lógica da tela de login
   ============================================================ */

import { login, recuperarSenha, saveSession } from './js_api.js';

// ── DOM refs ──────────────────────────────────────────────────
const emailInput  = document.getElementById('email');
const senhaInput  = document.getElementById('senha');
const lembrarChk  = document.getElementById('lembrar');
const btnLogin    = document.getElementById('btnLogin');
const btnToggle   = document.getElementById('toggleSenha');
const eyeIcon     = document.getElementById('eyeIcon');
const emailErr    = document.getElementById('emailErr');
const senhaErr    = document.getElementById('senhaErr');
const openForgot  = document.getElementById('openForgot');
const modalForgot = document.getElementById('modalForgot');
const closeForgot = document.getElementById('closeForgot');
const emailReset  = document.getElementById('emailReset');
const btnReset    = document.getElementById('btnReset');
const toast       = document.getElementById('toast');
const toastIcon   = document.getElementById('toastIcon');
const toastMsg    = document.getElementById('toastMsg');

// ── Preencher e-mail salvo ────────────────────────────────────
const savedEmail = localStorage.getItem('as_remember_email');
if (savedEmail) {
  emailInput.value   = savedEmail;
  lembrarChk.checked = true;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'err') {
  toast.className = `toast t-${type} show`;
  toastIcon.textContent = type === 'ok' ? '✓' : '✕';
  toastMsg.textContent  = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 3600);
}

// ── Toggle senha ──────────────────────────────────────────────
btnToggle.addEventListener('click', () => {
  const isHidden = senhaInput.type === 'password';
  senhaInput.type = isHidden ? 'text' : 'password';
  eyeIcon.innerHTML = isHidden
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
       <line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
       <circle cx="12" cy="12" r="3"/>`;
});

// ── Validação ─────────────────────────────────────────────────
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate() {
  let ok = true;

  emailInput.classList.remove('err');
  senhaInput.classList.remove('err');
  emailErr.classList.remove('show');
  senhaErr.classList.remove('show');

  if (!RE_EMAIL.test(emailInput.value.trim())) {
    emailInput.classList.add('err');
    emailErr.classList.add('show');
    ok = false;
  }
  if (!senhaInput.value.trim()) {
    senhaInput.classList.add('err');
    senhaErr.classList.add('show');
    ok = false;
  }
  return ok;
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
  if (!validate()) return;

  btnLogin.classList.add('loading');
  btnLogin.disabled = true;

  try {
    const data  = await login(emailInput.value.trim(), senhaInput.value);
    const token = data.token  || data.accessToken;
    const role  = data.role   || data.perfil;

    saveSession(token, role);

    if (lembrarChk.checked) {
      localStorage.setItem('as_remember_email', emailInput.value.trim());
    } else {
      localStorage.removeItem('as_remember_email');
    }

    showToast('Login realizado! Redirecionando…', 'ok');
    setTimeout(() => {
      window.location.href = role === 'ADMIN' ? 'admin.html' : 'acesso-negado.html';
    }, 950);

  } catch (e) {
    showToast(e.message || 'Credenciais inválidas.', 'err');
  } finally {
    btnLogin.classList.remove('loading');
    btnLogin.disabled = false;
  }
}

btnLogin.addEventListener('click', handleLogin);
document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

// ── Modal "esqueci minha senha" ───────────────────────────────
openForgot.addEventListener('click', e => {
  e.preventDefault();
  if (emailInput.value) emailReset.value = emailInput.value;
  modalForgot.classList.add('open');
});

closeForgot.addEventListener('click',  () => modalForgot.classList.remove('open'));
modalForgot.addEventListener('click', e => {
  if (e.target === modalForgot) modalForgot.classList.remove('open');
});

btnReset.addEventListener('click', async () => {
  const email = emailReset.value.trim();
  if (!email) return;

  btnReset.classList.add('loading');
  btnReset.disabled = true;

  try {
    await recuperarSenha(email);
    modalForgot.classList.remove('open');
    showToast('E-mail de recuperação enviado!', 'ok');
  } catch {
    showToast('Erro ao enviar. Tente novamente.', 'err');
  } finally {
    btnReset.classList.remove('loading');
    btnReset.disabled = false;
  }
});
