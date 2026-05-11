// ============================================================
// js_acesso_restrito.js — Asthma Space · Tela de Acesso Restrito
// ============================================================

const FIREBASE_APK = '#'; // ex: 'https://appdistribution.firebase.google.com/...'
const PLAY_STORE   = '#'; // ex: 'https://play.google.com/store/apps/details?id=...'
const APP_STORE    = '#'; // ex: 'https://apps.apple.com/app/...'

// ── Redireciona admin direto pro painel ──
const role  = sessionStorage.getItem('as_role');
const token = sessionStorage.getItem('as_token');

if (role === 'ADMIN') {
  window.location.href = 'admin.html';
}

// ── Exibe o e-mail extraído do JWT ──
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const email   = payload.sub || payload.email || payload.login || '';
  if (email) {
    document.getElementById('userEmail').textContent = `(${email})`;
  }
} catch {
  // ignora se não conseguir decodificar
}

// ── Links das lojas ──
const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

const btnAndroid = document.getElementById('btnAndroid');
const btnIOS     = document.getElementById('btnIOS');

btnAndroid.href = isAndroid
  ? (PLAY_STORE !== '#' ? PLAY_STORE : FIREBASE_APK)
  : PLAY_STORE;

btnIOS.href = APP_STORE;

// Se for Android e só tiver APK disponível, adapta o label
if (isAndroid && PLAY_STORE === '#' && FIREBASE_APK !== '#') {
  btnAndroid.querySelector('.btn-store-sub').textContent  = 'Baixar APK via';
  btnAndroid.querySelector('.btn-store-name').textContent = 'Firebase';
}