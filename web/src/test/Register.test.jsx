import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../features/auth/components/Register';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('Register Component', () => {
    const renderRegister = () => render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    it('renders registration form with all fields', () => {
        renderRegister();
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('renders role selector buttons', () => {
        renderRegister();
        expect(screen.getByText(/User/i)).toBeInTheDocument();
        expect(screen.getByText(/Manager/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty form submission', async () => {
        renderRegister();
        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
        renderRegister();
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'StrongP1!' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'StrongP1!' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    });

    it('validates password strength', async () => {
        renderRegister();
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'short' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('validates password confirmation match', async () => {
        renderRegister();
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'StrongP1!' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Different1!' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    });

    it('navigates to login page on login link click', () => {
        renderRegister();
        fireEvent.click(screen.getByText('Log in'));
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('sets page title to StandUpSync | Register', () => {
        renderRegister();
        expect(document.title).toBe('StandUpSync | Register');
    });
});
