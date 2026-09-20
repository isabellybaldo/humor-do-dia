'use client';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import ThemeToggle from './ThemeToggle';
import { emojiMap } from './appData';

const MOOD_WORDS = {
  1: 'péssimo', 2: 'ruim', 3: 'meh', 4: 'baixo', 5: 'ok',
  6: 'bom', 7: 'ótimo', 8: 'muito bom', 9: 'excelente', 10: 'incrível',
};

function randomEmoji(level) {
  const set = emojiMap[level] || emojiMap[5];
  return set[Math.floor(Math.random() * set.length)];
}

export default function Home() {
  const [name, setName] = useState('');
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState('');
  const [board, setBoard] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setEmoji(randomEmoji(5)); }, []);

  async function loadBoard() {
    try {
      const res = await fetch('/api/entries');
      if (res.ok) setBoard(await res.json());
    } catch { /* keep last board on transient failure */ }
  }
  useEffect(() => { loadBoard(); }, []);

  // Tapping a number sets the mood and refreshes the live emoji.
  // Re-tapping the same number reshuffles the emoji for that level.
  function selectMood(level) {
    setMood(level);
    setEmoji(randomEmoji(level));
    setSaved(false);
    setError('');
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Escreve teu nome primeiro. 🙂'); return; }
    const res = await fetch('/api/entries', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, mood: Number(mood), note, emoji }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Erro ao salvar.');
      return;
    }
    setSaved(true);
    await loadBoard();
  }

  const me = board.find(b => b.person === name.trim().toLowerCase());

  return (
    <main>
      <ThemeToggle />
      {Number(mood) === 10 && <Confetti />}
      <h1>Humor do Dia</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      <form className="pixel-card mood-form" onSubmit={save}>
        <div className="mood-hero">
          <div className="mood-hero__emoji" aria-hidden="true">{emoji || '🎲'}</div>
          <div className="mood-hero__word">{MOOD_WORDS[mood]} · {mood}/10</div>
        </div>

        <label htmlFor="name-input">Seu nome</label>
        <input
          id="name-input"
          className="pixel-input"
          placeholder="Digite seu nome"
          value={name}
          onChange={e => { setName(e.target.value); setSaved(false); }}
        />

        <p className="mood-label">Como está seu humor hoje?</p>
        <div className="mood-grid" role="group" aria-label="Escolha seu humor de 1 a 10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              className={`mood-btn mood-btn--${n <= 3 ? 'low' : n <= 6 ? 'mid' : 'high'}${mood === n ? ' is-selected' : ''}`}
              aria-pressed={mood === n}
              onClick={() => selectMood(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <label htmlFor="note-input">Observação (opcional)</label>
        <input
          id="note-input"
          className="pixel-input"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <div className="mood-actions">
          <button className="pixel-btn pixel-btn--pink" type="submit">Salvar</button>
          {saved && <span className="saved-msg" role="status">salvo! ✓</span>}
        </div>

        {error && <p role="alert" className="tag" style={{ background: 'var(--pink)' }}>{error}</p>}
        {saved && me?.gifUrl && <img className="reward-gif" src={me.gifUrl} alt="" />}
        {saved && me?.isSweetheart && <div className="hearts">{'❤️ '.repeat(5)}</div>}
      </form>

      <div className="pixel-card">
        <h3>Board de hoje</h3>
        {board.length === 0 ? (
          <p className="muted">ninguém registrou o humor ainda… seja o primeiro 👀</p>
        ) : (
          <div className="board-grid">
            {board.map(b => (
              <div key={b.person} className="board-card">
                <div className="board-card__emoji">{b.emoji}</div>
                <div className="board-card__name">{b.displayName}</div>
                <span className="tag">{b.mood}/10</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
