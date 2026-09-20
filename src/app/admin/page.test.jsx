import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from './page';

beforeEach(() => {
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
});

describe('Admin', () => {
  it('renders a password-manager-friendly login form', async () => {
    render(<Admin />);
    const user = await screen.findByLabelText(/usuário/i);
    const pass = screen.getByLabelText(/senha/i);
    expect(user).toHaveAttribute('autocomplete', 'username');
    expect(pass).toHaveAttribute('type', 'password');
    expect(pass).toHaveAttribute('autocomplete', 'current-password');
  });
});
