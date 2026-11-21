import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
import AuthPage from './AuthPage.jsx';
vi.mock('../auth/AuthContext.jsx',()=>({useAuth:()=>({login:vi.fn(),signup:vi.fn()})}));
describe('AuthPage',()=>{it('shows accessible login fields and password recovery link',()=>{render(<AuthPage mode="login" navigate={vi.fn()}/>);expect(screen.getByLabelText('Email address')).toHaveAttribute('type','email');expect(screen.getByLabelText('Password')).toHaveAttribute('type','password');expect(screen.getByRole('button',{name:'Forgot password?'})).toBeInTheDocument();});it('navigates to password recovery',()=>{const navigate=vi.fn();render(<AuthPage mode="login" navigate={navigate}/>);fireEvent.click(screen.getByRole('button',{name:'Forgot password?'}));expect(navigate).toHaveBeenCalledWith('/forgot-password');});it('rejects mismatched signup confirmation',async()=>{const {container}=render(<AuthPage mode="signup" navigate={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Your name'),{target:{value:'Taylor'}});fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'taylor@example.com'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'long-password-value'}});fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'different-password-value'}});fireEvent.submit(container.querySelector('form'));expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');});});


