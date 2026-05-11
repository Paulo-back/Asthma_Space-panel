/* ============================================================
   js_admin.js — Asthma Space · Gerenciar Perfis
   ============================================================ */

import { getToken, getRole, clearSession, listarClientes, atualizarCliente } from './js_api.js';

// ── Auth guard ────────────────────────────────────────────────
if (!getToken() || getRole() !== 'ADMIN') {
  window.location.href = 'index.html';
}

// ── DOM refs ──────────────────────────────────────────────────
const searchInput    = document.getElementById('searchInput');
const userList       = document.getElementById('userList');
const sidebarEmpty   = document.getElementById('sidebarEmpty');
const editPanel      = document.getElementById('editPanel');
const btnLogout      = document.getElementById('btnLogout');

// stats
const statTotal    = document.getElementById('statTotal');
const statAtivos   = document.getElementById('statAtivos');
const statAdmins   = document.getElementById('statAdmins');
const statInativos = document.getElementById('statInativos');

// aba perfil
const editAvatar    = document.getElementById('editAvatar');
const editHeadName  = document.getElementById('editHeadName');
const editHeadMeta  = document.getElementById('editHeadMeta');
const editNome      = document.getElementById('editNome');
const editEmail     = document.getElementById('editEmail');
const editTelefone  = document.getElementById('editTelefone');
const editCpf       = document.getElementById('editCpf');
const editDataNasc  = document.getElementById('editDataNasc');
const editSexo      = document.getElementById('editSexo');
const btnSalvar     = document.getElementById('btnSalvar');
const btnVerSaude   = document.getElementById('btnVerSaude');

// aba conta
const editRole      = document.getElementById('editRole');
const toggleAtivo   = document.getElementById('toggleAtivo');
const editSenha     = document.getElementById('editSenha');
const editSenhaConf = document.getElementById('editSenhaConf');
const btnToggleSenha= document.getElementById('btnToggleSenha');
const eyeSenhaIcon  = document.getElementById('eyeSenhaIcon');
const btnSalvarConta= document.getElementById('btnSalvarConta');
const btnDesativar  = document.getElementById('btnDesativar');

// modal saúde
const modalSaude    = document.getElementById('modalSaude');
const mProblema     = document.getElementById('mProblema');
const mMedicamentos = document.getElementById('mMedicamentos');
const mAlergias     = document.getElementById('mAlergias');
const mContato      = document.getElementById('mContato');
const mCep          = document.getElementById('mCep');
const mLogradouro   = document.getElementById('mLogradouro');
const mNumero       = document.getElementById('mNumero');
const mComplemento  = document.getElementById('mComplemento');
const mBairro       = document.getElementById('mBairro');
const mCidade       = document.getElementById('mCidade');
const mEstado       = document.getElementById('mEstado');
const btnSalvarSaude= document.getElementById('btnSalvarSaude');

// modal confirmação
const modalConfirm  = document.getElementById('modalConfirm');
const modalTitle    = document.getElementById('modalTitle');
const modalDesc     = document.getElementById('modalDesc');
const modalCancel   = document.getElementById('modalCancel');
const modalOk       = document.getElementById('modalOk');

// toast
const toastEl   = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMsg  = document.getElementById('toastMsg');

// ── Estado ────────────────────────────────────────────────────
let allUsers     = [];
let selectedUser = null;
let activeFilter = 'TODOS';
let pendingFn    = null;

// ── Demo data — remova ao integrar com backend ────────────────
const DEMO = [
  { id:1, nome:'Ana Beatriz Costa',  email:'ana@email.com',   telefone:'(11)99999-0001', cpf:'111.111.111-11', dataNascimento:'1990-05-14', sexo:'Feminino',  role:'ADMIN',  ativo:true,  problema_respiratorio:'Asma persistente', medicamentos:'Salbutamol',  alergias:'Pólen',       contatoEmergencia:'João 99999-0000', endereco:{cep:'01001-000',logradouro:'Praça da Sé',numero:'1',complemento:'',bairro:'Sé',cidade:'São Paulo',uf:'SP'} },
  { id:2, nome:'Carlos Mendes',      email:'carlos@email.com',telefone:'(11)99999-0002', cpf:'222.222.222-22', dataNascimento:'1985-08-22', sexo:'Masculino', role:'MEDICO', ativo:true,  problema_respiratorio:'',                medicamentos:'',            alergias:'',            contatoEmergencia:'',                endereco:null },
  { id:3, nome:'Fernanda Oliveira',  email:'fer@email.com',   telefone:'(11)99999-0003', cpf:'333.333.333-33', dataNascimento:'1995-03-30', sexo:'Feminino',  role:'USER',   ativo:true,  problema_respiratorio:'Rinite alérgica', medicamentos:'Loratadina',  alergias:'Pelos de gato',contatoEmergencia:'',                endereco:null },
  { id:4, nome:'Lucas Rodrigues',    email:'lucas@email.com', telefone:'',               cpf:'444.444.444-44', dataNascimento:'1998-11-07', sexo:'Masculino', role:'USER',   ativo:false, problema_respiratorio:'',                medicamentos:'',            alergias:'',            contatoEmergencia:'',                endereco:null },
  { id:5, nome:'Mariana Santos',     email:'mari@email.com',  telefone:'(11)99999-0005', cpf:'555.555.555-55', dataNascimento:'2000-01-18', sexo:'Feminino',  role:'USER',   ativo:true,  problema_respiratorio:'DPOC leve',       medicamentos:'Ipratrópio',  alergias:'Poeira',      contatoEmergencia:'Carlos 99999-0002',endereco:null },
  { id:6, nome:'Rafael Souza',       email:'rafa@email.com',  telefone:'(11)99999-0006', cpf:null,             dataNascimento:'1980-06-25', sexo:'Masculino', role:'MEDICO', ativo:true,  problema_respiratorio:'',                medicamentos:'',            alergias:'',            contatoEmergencia:'',                endereco:null },
  { id:7, nome:'Juliana Pereira',    email:'ju@email.com',    telefone:'',               cpf:'777.777.777-77', dataNascimento:'1993-09-12', sexo:'Feminino',  role:'USER',   ativo:false, problema_respiratorio:'',                medicamentos:'',            alergias:'',            contatoEmergencia:'',                endereco:null },
];

// ── Utilitários ───────────────────────────────────────────────
const AVATAR_COLORS = ['#4FC3F7','#56CFB2','#FFB347','#FF8A80','#CE93D8','#80CBC4'];

const avatarColor = name => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];
const initials    = name => (name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
const badgeClass  = role => ({ ADMIN:'badge-admin', USER:'badge-user', MEDICO:'badge-medico' }[role] || 'badge-user');

function showToast(msg, type = 'ok') {
  toastEl.className = `toast t-${type} show`;
  toastIcon.textContent = type === 'err' ? '✕' : '✓';
  toastMsg.textContent  = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 3600);
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  statTotal.textContent    = allUsers.length;
  statAtivos.textContent   = allUsers.filter(u =>  u.ativo).length;
  statAdmins.textContent   = allUsers.filter(u =>  u.role === 'ADMIN').length;
  statInativos.textContent = allUsers.filter(u => !u.ativo).length;
}

// ── Filtro + busca ────────────────────────────────────────────
function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('active', c.dataset.filter === filter)
  );
  renderList();
}

function getFiltered() {
  const q = searchInput.value.toLowerCase();
  return allUsers.filter(u => {
    const matchFilter =
      activeFilter === 'TODOS'   ? true :
      activeFilter === 'INATIVO' ? !u.ativo :
      u.role === activeFilter;
    const matchSearch = !q ||
      (u.nome  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

// ── Render lista ──────────────────────────────────────────────
function renderList() {
  const list = getFiltered();

  if (!list.length) {
    userList.innerHTML = `
      <div class="list-empty">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <p>Nenhum usuário encontrado.</p>
      </div>`;
    return;
  }

  userList.innerHTML = '';
  list.forEach((u, i) => {
    const row = document.createElement('div');
    row.className = `user-row${selectedUser?.id === u.id ? ' selected' : ''}`;
    row.style.animationDelay = `${i * 0.04}s`;
    row.innerHTML = `
      <div class="avatar" style="background:${avatarColor(u.nome)}">${initials(u.nome)}</div>
      <div>
        <div class="user-name">${u.nome}</div>
        <div class="user-email">${u.email}</div>
      </div>
      <span class="badge ${badgeClass(u.role)}">${u.role}</span>
      <div class="dot ${u.ativo ? 'dot-on' : 'dot-off'}" title="${u.ativo ? 'Ativo' : 'Inativo'}"></div>
      <div class="chevron"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
    `;
    row.addEventListener('click', () => selectUser(u));
    userList.appendChild(row);
  });
}

// ── Formatar telefone para exibição ──────────────────────────
function formatarTelefone(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10)     return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 6)      return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2)      return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
}

// ── Selecionar usuário ────────────────────────────────────────
function selectUser(u) {
  selectedUser = u;
  renderList();

  sidebarEmpty.style.display = 'none';
  editPanel.style.display    = 'block';

  // Cabeçalho
  const color = avatarColor(u.nome);
  editAvatar.textContent      = initials(u.nome);
  editAvatar.style.background = color;
  editHeadName.textContent    = u.nome;
  editHeadMeta.textContent    = `ID #${u.id} · ${u.role}`;

  // Aba Perfil
  editNome.value      = u.nome             || '';
  editEmail.value     = u.email            || '';
  editTelefone.value  = formatarTelefone(u.telefone || '');
  editCpf.value       = u.cpf              || '';
  editDataNasc.value  = u.dataNascimento   || '';
  editSexo.value      = u.sexo             || '';

  // Aba Conta
  editRole.value      = u.role             || 'USER';
  editSenha.value     = '';
  editSenhaConf.value = '';
  toggleAtivo.className = `toggle-switch${u.ativo ? ' on' : ''}`;
  refreshDesativarBtn(u.ativo);

  // Volta sempre para aba Perfil ao trocar de usuário
  switchTab('perfil');
}

function refreshDesativarBtn(ativo) {
  btnDesativar.textContent = ativo ? 'Desativar conta' : 'Reativar conta';
  btnDesativar.className   = `btn ${ativo ? 'btn-danger' : 'btn-success-outline'} btn-full`;
}

// ── Abas ──────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name)
  );
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${name}`)
  );
}

document.querySelectorAll('.tab-btn').forEach(b =>
  b.addEventListener('click', () => switchTab(b.dataset.tab))
);

// ── Toggle senha ──────────────────────────────────────────────
btnToggleSenha.addEventListener('click', () => {
  const showing = editSenha.type === 'text';
  editSenha.type = showing ? 'password' : 'text';
  eyeSenhaIcon.innerHTML = showing
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>'
      + '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>'
      + '<line x1="1" y1="1" x2="23" y2="23"/>';
});

// ── Telefone mask ────────────────────────────────────────────
editTelefone.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10)     v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
  this.value = v;
});

// ── CPF mask ──────────────────────────────────────────────────
editCpf.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

// ── Toggle ativo ──────────────────────────────────────────────
toggleAtivo.addEventListener('click', () => {
  toggleAtivo.classList.toggle('on');
  refreshDesativarBtn(toggleAtivo.classList.contains('on'));
});

// ── Payload base (campos comuns às duas abas) ─────────────────
// ── Payload completo — espelha DadosAtualizarClienteAdmin ─────
// Sempre monta o objeto inteiro para garantir que nenhum campo
// seja sobrescrito com null por estar em outra aba.
function buildPayload() {
  return {
    // aba Perfil
    nome:           editNome.value.trim()      || null,
    email:          editEmail.value.trim()     || null,
    telefone:       editTelefone.value.replace(/\D/g, '').slice(0,11) || null,
    cpf:            editCpf.value.trim()       || null,
    dataNascimento: editDataNasc.value         || null,
    sexo:           (editSexo.value && editSexo.value !== 'Selecione') ? editSexo.value : null,
    // aba Conta
    role:           editRole.value             || null,
    ativo:          toggleAtivo.classList.contains('on'),
    // saúde & endereço: mantém valores atuais do usuário
    // (sobrescritos pelo modal quando necessário)
    medicamentos:          selectedUser.medicamentos           || null,
    problema_respiratorio: selectedUser.problema_respiratorio  || null,
    alergias:              selectedUser.alergias               || null,
    contatoEmergencia:     selectedUser.contatoEmergencia      || null,
    endereco:              selectedUser.endereco               || null, // {cep,logradouro,numero,complemento,bairro,cidade,uf}
  };
}

// ── Salvar aba Perfil ─────────────────────────────────────────
btnSalvar.addEventListener('click', async () => {
  if (!selectedUser) return;
  btnSalvar.classList.add('loading');
  btnSalvar.disabled = true;
  await doSave(buildPayload(), btnSalvar, null);
});

// ── Salvar aba Conta ──────────────────────────────────────────
btnSalvarConta.addEventListener('click', async () => {
  if (!selectedUser) return;
  const senha = editSenha.value;
  const conf  = editSenhaConf.value;
  if (senha && senha !== conf) { showToast('As senhas não coincidem.', 'err'); return; }

  const payload = buildPayload();
  if (senha) payload.senha = senha;

  btnSalvarConta.classList.add('loading');
  btnSalvarConta.disabled = true;
  await doSave(payload, btnSalvarConta, null);
});

// ── Salvar saúde & endereço ───────────────────────────────────
btnSalvarSaude.addEventListener('click', async () => {
  if (!selectedUser) return;

  const payload = buildPayload();
  // sobrescreve apenas os campos do modal com os valores editados
  payload.problema_respiratorio = mProblema.value.trim()     || null;
  payload.medicamentos          = mMedicamentos.value.trim() || null;
  payload.alergias              = mAlergias.value.trim()     || null;
  payload.contatoEmergencia     = mContato.value.trim()      || null;
  // Campos espelham DadosEndereco do backend (igual ao Android)
  payload.endereco = {
    cep:         mCep.value.replace(/\D/g, '')         || null,
    logradouro:  mLogradouro.value.trim()               || null,
    numero:      mNumero.value.trim()                   || null,
    complemento: mComplemento.value.trim()              || null,
    bairro:      mBairro.value.trim()                   || null,
    cidade:      mCidade.value.trim()                   || null,
    uf:          mEstado.value.trim().toUpperCase()     || null,
  };

  btnSalvarSaude.classList.add('loading');
  btnSalvarSaude.disabled = true;
  await doSave(payload, btnSalvarSaude, () => {
    modalSaude.classList.remove('open');
  });
});

// ── doSave — envia ao backend e atualiza estado local ─────────
async function doSave(payload, btn, onSuccess) {
  try {
    const data = await atualizarCliente(selectedUser.id, payload);
    patchLocal(Object.assign({}, payload, data || {}));
    showToast('Salvo com sucesso!', 'ok');
    if (onSuccess) onSuccess();
  } catch (e) {
    // fallback demo: aplica localmente mesmo sem backend
    patchLocal(payload);
    showToast('Salvo localmente (demo): ' + e.message, 'ok');
    if (onSuccess) onSuccess();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function patchLocal(payload) {
  const idx = allUsers.findIndex(u => u.id === selectedUser.id);
  allUsers[idx] = { ...selectedUser, ...payload };
  selectedUser  = allUsers[idx];
  updateStats();
  renderList();
  editHeadName.textContent    = selectedUser.nome;
  editHeadMeta.textContent    = `ID #${selectedUser.id} · ${selectedUser.role}`;
  editAvatar.textContent      = initials(selectedUser.nome);
  editAvatar.style.background = avatarColor(selectedUser.nome);
  refreshDesativarBtn(selectedUser.ativo);
}

// ── Modal Saúde ───────────────────────────────────────────────
btnVerSaude.addEventListener('click', () => {
  if (!selectedUser) return;
  const u   = selectedUser;
  const end = u.endereco || {};
  mProblema.value    = u.problema_respiratorio || '';
  mMedicamentos.value= u.medicamentos          || '';
  mAlergias.value    = u.alergias              || '';
  mContato.value     = u.contatoEmergencia     || '';
  mCep.value         = end.cep                 || '';
  mLogradouro.value  = end.logradouro          || '';
  mNumero.value      = end.numero              || '';
  mComplemento.value = end.complemento         || '';
  mBairro.value      = end.bairro              || '';
  mCidade.value      = end.cidade || end.localidade || '';
  mEstado.value      = end.uf || end.estado    || '';
  modalSaude.classList.add('open');
});

document.getElementById('closeSaude').addEventListener('click',  () => modalSaude.classList.remove('open'));
document.getElementById('cancelSaude').addEventListener('click', () => modalSaude.classList.remove('open'));
modalSaude.addEventListener('click', e => { if (e.target === modalSaude) modalSaude.classList.remove('open'); });

// ── CEP mask + ViaCEP ─────────────────────────────────────────
mCep.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  this.value = v;
});

mCep.addEventListener('blur', async function () {
  const cep = this.value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  try {
    const d = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json());
    if (d.erro) return;
    mLogradouro.value = d.logradouro || '';
    mBairro.value     = d.bairro     || '';
    mCidade.value     = d.localidade || '';
    mEstado.value     = d.uf         || '';
  } catch {}
});

// ── Desativar / Reativar ──────────────────────────────────────
btnDesativar.addEventListener('click', () => {
  if (!selectedUser) return;
  const isAtivo = toggleAtivo.classList.contains('on');

  modalTitle.textContent = isAtivo ? 'Desativar conta?' : 'Reativar conta?';
  modalDesc.textContent  = isAtivo
    ? `O usuário ${selectedUser.nome} perderá o acesso ao sistema. Pode ser reativado a qualquer momento.`
    : `O usuário ${selectedUser.nome} voltará a ter acesso ao sistema normalmente.`;
  modalOk.textContent = isAtivo ? 'Desativar' : 'Reativar';
  modalOk.className   = `btn ${isAtivo ? 'btn-danger' : 'btn-success-outline'}`;

  pendingFn = () => {
    toggleAtivo.classList.toggle('on');
    btnSalvarConta.click();
    modalConfirm.classList.remove('open');
  };
  modalConfirm.classList.add('open');
});

modalCancel.addEventListener('click', () => modalConfirm.classList.remove('open'));
modalOk.addEventListener('click',     () => { if (pendingFn) pendingFn(); });
modalConfirm.addEventListener('click', e => {
  if (e.target === modalConfirm) modalConfirm.classList.remove('open');
});

// ── Search + filtros + logout ─────────────────────────────────
searchInput.addEventListener('input', () => renderList());
document.querySelectorAll('.chip').forEach(chip =>
  chip.addEventListener('click', () => applyFilter(chip.dataset.filter))
);
btnLogout.addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const data = await listarClientes();
    allUsers = Array.isArray(data) ? data : (data.content || []);
  } catch {
    allUsers = DEMO;
  }
  updateStats();
  applyFilter('TODOS');
}

init();