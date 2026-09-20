'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => { setTheme(document.documentElement.getAttribute('data-theme') || 'dark'); }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  }
  return <button className="pixel-btn theme-toggle" onClick={toggle}>{theme === 'light' ? '☾ dark' : '☀ light'}</button>;
}
