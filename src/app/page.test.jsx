import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';

beforeEach(() => {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('/api/entries') && opts?.method === 'POST') {
      return { ok: true, json: async () => ({ ok: true, emoji: '😎' }) };
    }
    return { ok: true, json: async () => [] }; // GET today board
  });
});

describe('Home', () => {
  it('selects a mood button and submits mood + a live emoji (WYSIWYG)', async () => {
    render(<Home />);
    fireEvent.change(await screen.findByPlaceholderText(/nome/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      const call = global.fetch.mock.calls.find(
        c => String(c[0]).includes('/api/entries') && c[1]?.method === 'POST',
      );
      expect(call).toBeTruthy();
      const body = JSON.parse(call[1].body);
      expect(body.mood).toBe(8);
      expect(typeof body.emoji).toBe('string');
      expect(body.emoji.length).toBeGreaterThan(0);
    });
  });
});
