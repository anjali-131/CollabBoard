import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PasswordRecoveryPage from './PasswordRecoveryPage.jsx';
import { request } from '../auth/AuthContext.jsx';
vi.mock('../auth/AuthContext.jsx', () => ({ request: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); history.replaceState({}, '', '/'); });

describe('PasswordRecoveryPage', () => {
  it('submits a password reset request and shows the generic response', async () => {
    request.mockResolvedValue({ message: 'If an account exists for this address and email delivery succeeds, you should receive a reset link shortly.' });
    render(<PasswordRecoveryPage mode="forgot" navigate={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'person@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
    expect(request).toHaveBeenCalledWith('/api/auth/password/forgot', expect.objectContaining({ method: 'POST' }));
  });
  it('checks confirmation before submitting a new password', async () => {
    history.replaceState({}, '', '/reset-password?token=present');
    render(<PasswordRecoveryPage mode="reset" navigate={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password-long-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'another-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(request).not.toHaveBeenCalled();
  });
});
