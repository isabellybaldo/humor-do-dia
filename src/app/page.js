'use client';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import ThemeToggle from './ThemeToggle';

export default function Home() {
  const [name, setName] = useState('');
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [board, setBoard] = useState([]);
  const [error, setError] = useState('');
  const [savedEmoji, setSavedEmoji] = useState('');

  async function loadBoard() {
    const res = await fetch('/api/entries');
    setBoard(await res.json());
  }
  useEffect(() => { loadBoard(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/entries', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, mood: Number(mood), note }),
    });
    if (!res.ok) { const j = await res.json(); setError(j.error || 'Erro ao salvar.'); return; }
    const j = await res.json();
    setSavedEmoji(j.emoji);
    await loadBoard();
  }

  const me = board.find(b => b.person === name.trim().toLowerCase());

  return (
    <main>
      <ThemeToggle />
      {Number(mood) === 10 && <Confetti />}
      <h1>Humor do Dia</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      <form className="pixel-card" onSubmit={save}>
        <p><label>Seu nome:</label><br />
          <input className="pixel-input" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} /></p>
        <p><label htmlFor="mood">Como está seu humor hoje? (1–10)</label><br />
          <input id="mood" className="pixel-input" type="number" min={1} max={10} value={mood} onChange={e => setMood(e.target.value)} /></p>
        <p><label>Observação (opcional):</label><br />
          <input className="pixel-input" value={note} onChange={e => setNote(e.target.value)} /></p>
        {savedEmoji && <div style={{ fontSize: '2rem' }}>{savedEmoji}</div>}
        {me?.gifUrl && <img src={me.gifUrl} alt="" style={{ maxWidth: 200, borderRadius: 8 }} />}
        {me?.isSweetheart && <div style={{ fontSize: '2rem' }}>{'❤️ '.repeat(5)}</div>}
        {error && <p role="alert" className="tag" style={{ background: 'var(--pink)' }}>{error}</p>}
        <button className="pixel-btn pixel-btn--pink" type="submit">Salvar</button>
      </form>

      <div className="pixel-card">
        <h3>Board de hoje</h3>
        <ul>
          {board.map(b => (
            <li key={b.person}><b>{b.displayName}</b>: {b.mood} <span style={{ fontSize: '1.4em' }}>{b.emoji}</span></li>
          ))}
        </ul>
      </div>
    </main>
  );
}
