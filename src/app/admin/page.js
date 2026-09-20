'use client';
import { useEffect, useState } from 'react';
import ThemeToggle from '../ThemeToggle';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', displayName: '', gifUrl: '', isSweetheart: false });

  async function loadRoster() {
    const res = await fetch('/api/roster');
    setRoster(await res.json());
  }
  useEffect(() => { loadRoster(); }, []);

  async function login(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', { method: 'POST', body: fd });
    if (res.ok) { setAuthed(true); await loadRoster(); } else setError('Login inválido.');
  }

  async function savePerson(e) {
    e.preventDefault();
    const res = await fetch('/api/roster', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.status === 401) { setAuthed(false); return; }
    setForm({ name: '', displayName: '', gifUrl: '', isSweetheart: false });
    await loadRoster();
  }

  async function deactivate(name) {
    await fetch('/api/roster', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await loadRoster();
  }

  return (
    <main>
      <ThemeToggle />
      <h1>Admin</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      {!authed && (
        <form className="pixel-card" method="post" action="/api/auth" onSubmit={login}>
          <h3>Login</h3>
          <p><label htmlFor="u">Usuário</label><br />
            <input id="u" name="username" className="pixel-input" autoComplete="username" /></p>
          <p><label htmlFor="p">Senha</label><br />
            <input id="p" name="password" type="password" className="pixel-input" autoComplete="current-password" /></p>
          {error && <p role="alert" className="tag" style={{ background: 'var(--pink)' }}>{error}</p>}
          <button className="pixel-btn" type="submit">Entrar</button>
        </form>
      )}

      {authed && (
        <form className="pixel-card" onSubmit={savePerson}>
          <h3>Adicionar / editar pessoa</h3>
          <input className="pixel-input" placeholder="name (id, minúsculo)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="pixel-input" placeholder="displayName" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          <input className="pixel-input" placeholder="gifUrl (opcional)" value={form.gifUrl} onChange={e => setForm({ ...form, gifUrl: e.target.value })} />
          <label><input type="checkbox" checked={form.isSweetheart} onChange={e => setForm({ ...form, isSweetheart: e.target.checked })} /> sweetheart 💛</label>
          <br /><button className="pixel-btn pixel-btn--pink" type="submit">Salvar pessoa</button>
        </form>
      )}

      <div className="pixel-card">
        <h3>Roster</h3>
        <ul>
          {roster.map(p => (
            <li key={p.name}>
              <b>{p.displayName}</b> ({p.name}){p.isSweetheart ? ' 💛' : ''}
              {authed && <button className="pixel-btn" style={{ marginLeft: 8 }} onClick={() => deactivate(p.name)}>desativar</button>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
