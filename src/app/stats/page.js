'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ThemeToggle from '../ThemeToggle';

const COLORS = ['#ffb3c6', '#cdb4f6', '#b8f2cd', '#ffd93d', '#8ecae6', '#ff9f9f'];

export default function Stats() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setData); }, []);
  if (!data) return <main><p>Carregando…</p></main>;

  const people = Object.keys(data.moodOverTime);
  const dist = Object.entries(data.distribution).map(([mood, count]) => ({ mood, count }));

  return (
    <main>
      <ThemeToggle />
      <h1>Stats</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      <div className="pixel-card">
        <h3>Humor ao longo do tempo</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart>
            <XAxis dataKey="date" allowDuplicatedCategory={false} />
            <YAxis domain={[1, 10]} /><Tooltip />
            {people.map((p, i) => (
              <Line key={p} data={data.moodOverTime[p]} dataKey="mood" name={p} stroke={COLORS[i % COLORS.length]} type="stepAfter" dot />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pixel-card">
        <h3>Vibe da turma (média diária)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.teamVibe}>
            <XAxis dataKey="date" /><YAxis domain={[1, 10]} /><Tooltip />
            <Line dataKey="avg" stroke="#cdb4f6" type="stepAfter" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pixel-card">
        <h3>Resumo por pessoa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {data.perPerson.map(p => (
            <div key={p.person} className="pixel-card" style={{ margin: 0 }}>
              <b>{p.person}</b> {p.latestEmoji}
              <div className="tag">média {p.avg.toFixed(1)}</div>
              <div className="tag">streak {p.streak}d</div>
              <div className="tag">↑{p.best} ↓{p.worst}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pixel-card">
        <h3>Distribuição de humores</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dist}>
            <XAxis dataKey="mood" /><YAxis allowDecimals={false} /><Tooltip />
            <Bar dataKey="count" fill="#b8f2cd" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
