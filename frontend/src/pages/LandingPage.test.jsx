import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage.jsx';

afterEach(cleanup);

describe('LandingPage', () => {
  it('presents the product, all requested sections, and working signup and login CTAs', () => {
    const navigate = vi.fn();
    render(<LandingPage navigate={navigate}/>);
    expect(screen.getByRole('heading', { name: 'Great ideas are better when built together.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A shared space for every great idea.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Everything you need to get ideas moving.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'From blank page to shared progress.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pick up where your team left off.' })).toBeInTheDocument();
    expect(document.getElementById('workspace')).toBeInTheDocument();
    expect(document.getElementById('contact')).not.toBeInTheDocument();
    const mainNavigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(mainNavigation.querySelectorAll('a')).toHaveLength(1);
    expect(mainNavigation).not.toHaveTextContent('Get Started');
    expect(screen.queryByRole('navigation', { name: 'Footer navigation' })).not.toBeInTheDocument();
    expect(document.querySelector('.footer-product')).not.toBeInTheDocument();
    expect(screen.queryByText('YOUR NEXT IDEA STARTS HERE')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Get started with CollabBoard/ })).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`© ${new Date().getFullYear()} CollabBoard`);
    expect(screen.getAllByRole('link', { name: /Get Started/ })).toHaveLength(1);
    fireEvent.click(document.querySelector('.hero-actions .landing-primary-cta'));
    expect(navigate).toHaveBeenCalledWith('/signup');
    fireEvent.click(screen.getByRole('link', { name: 'Sign In' }));
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('opens and closes its mobile menu accessibly, including with Escape', () => {
    render(<LandingPage navigate={vi.fn()}/>);
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('is-open');
    fireEvent.keyDown(screen.getByRole('navigation', { name: 'Main navigation' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });
});
