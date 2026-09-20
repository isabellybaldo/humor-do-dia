import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';

beforeEach(() => {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('/api/roster')) return { ok: true, json: async () => [{ name: 'ana', displayName: 'Ana' }] };
    if (String(url).includes('/api/entries') && opts?.method === 'POST') return { ok: true, json: async () => ({ ok: true, emoji: '😎' }) };
    return { ok: true, json: async () => [] }; // GET today board
  });
});

describe('Home', () => {
  it('submits a mood for a roster name', async () => {
    render(<Home />);
    fireEvent.change(await screen.findByPlaceholderText(/nome/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/humor/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/entries', expect.objectContaining({ method: 'POST' })));
  });
});
