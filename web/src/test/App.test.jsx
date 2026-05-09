import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        expect(document.querySelector('.app-container')).toBeInTheDocument();
    });

    it('renders login page at root route', () => {
        render(<App />);
        expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });

    it('contains login form elements', () => {
        render(<App />);
        expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('has registration link', () => {
        render(<App />);
        expect(screen.getByText(/Register/i)).toBeInTheDocument();
    });
});
