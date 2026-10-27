import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickExitButton from '../src/components/QuickExitButton.jsx';
import { I18nProvider, useI18n } from '../src/i18n/index.js';

function LanguageTestComponent() {
  const { lang, toggleLang, t } = useI18n();
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <span data-testid="title">{t('grievanceTitle')}</span>
      <span data-testid="subtitle">{t('grievanceSubtitle')}</span>
      <button onClick={toggleLang} data-testid="toggle-btn">
        Toggle
      </button>
    </div>
  );
}

describe('S1b Client UI & Additions', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => {
    cleanup();
    document.body.style.removeProperty('visibility');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('[A-N58] quick-exit button redirects and hides form', () => {
    const onExitSpy = vi.fn(() => {
      expect(document.body.style.visibility).toBe('hidden');
    });

    // Mock window.location.replace
    const replaceMock = vi.fn(() => {
      expect(document.body.style.visibility).toBe('hidden');
      expect(onExitSpy).toHaveBeenCalled();
    });
    vi.stubGlobal('location', { replace: replaceMock });

    render(
      <I18nProvider>
        <QuickExitButton onExit={onExitSpy} neutralUrl="https://www.aicte-india.org/" />
      </I18nProvider>
    );

    const button = screen.getByRole('button', { name: /quick exit/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    // Verifies exit callback and browser redirect were triggered
    expect(onExitSpy).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('https://www.aicte-india.org/');
  });

  it('[A-N64] hindi and english interface on complainant pages', () => {
    render(
      <I18nProvider>
        <LanguageTestComponent />
      </I18nProvider>
    );

    // Initial language is English
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('title').textContent).toBe('Grievance Intake Portal');
    expect(screen.getByTestId('subtitle').textContent).toBe('Every voice, at the right door.');

    // Toggle to Hindi
    fireEvent.click(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('current-lang').textContent).toBe('hi');
    expect(screen.getByTestId('title').textContent).toContain('शिकायत निवारण पोर्टल');
    expect(screen.getByTestId('subtitle').textContent).toContain('हर आवाज़, सही द्वार तक।');

    // Toggle back to English
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('title').textContent).toBe('Grievance Intake Portal');
  });

  it('[A-N64] defaults to Hindi for a Hindi browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('hi-IN');
    render(<I18nProvider><LanguageTestComponent /></I18nProvider>);
    expect(screen.getByTestId('current-lang').textContent).toBe('hi');
    expect(screen.getByTestId('title').textContent).toContain('शिकायत निवारण पोर्टल');
  });

  it('[A-N64] language changes stay in context and a fresh provider uses the browser default', () => {
    render(<I18nProvider><LanguageTestComponent /></I18nProvider>);
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('current-lang').textContent).toBe('hi');
    cleanup();
    render(<I18nProvider><LanguageTestComponent /></I18nProvider>);
    expect(screen.getByTestId('current-lang').textContent).toBe('en');
  });
});
