import React from 'react';

export default function ThemeToggle({ theme = 'light', onToggle = () => {}, className = '' }) {
  const dark = theme === 'dark';
  return <button
    type="button"
    className={`theme-toggle ${className}`.trim()}
    aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
    aria-pressed={dark}
    title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    onClick={onToggle}
  >
    <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
  </button>;
}
