import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../features/auth/components/Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login Component', () => {
    const renderLogin = () => render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );

    it('renders login form with all elements', () => {
        renderLogin();
        expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
        expect(screen.getByText(/Back/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        renderLogin();
        const submitBtn = screen.getByRole('button', { name: /Login/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    it('navigates to register page on register link click', () => {
        renderLogin();
        const registerLink = screen.getByText('Register');
        fireEvent.click(registerLink);
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('sets page title to StandUpSync | Login', () => {
        renderLogin();
        expect(document.title).toBe('StandUpSync | Login');
    });
});
