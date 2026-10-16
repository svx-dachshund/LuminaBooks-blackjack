import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import BlackjackSettings from './BlackjackSettings';
import type { BlackjackOptions } from '../electron.d';

interface TerminalViewProps {
  lang: 'en' | 'ru';
}

const STORAGE_KEY = 'lumina_blackjack_options';

function loadOptions(): BlackjackOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore
  }
  return {};
}

const TerminalView: React.FC<TerminalViewProps> = ({ lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const exitedRef = useRef(false);
  const lineBufferRef = useRef('');
  const [options, setOptions] = useState<BlackjackOptions>(() => loadOptions());
  const optionsRef = useRef<BlackjackOptions>(options);

  const [notAvailable, setNotAvailable] = useState(false);
  const [running, setRunning] = useState(false);

  // Синхронизация options → ref + localStorage
  useEffect(() => {
    optionsRef.current = options;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // ignore
    }
  }, [options]);

  // Инициализация xterm — один раз
  useEffect(() => {
    if (!containerRef.current) return;

    const api = window.electronAPI?.terminal;
    if (!api) {
      setNotAvailable(true);
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      convertEol: true,
      scrollback: 5000,
      theme: {
        background: '#0e1512',
        foreground: '#e5efe9',
        cursor: '#6B9071',
        selectionBackground: 'rgba(107,144,113,0.35)',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    try { fit.fit(); } catch { /* ignore */ }
    termRef.current = term;

    const offData = api.onData((chunk) => term.write(chunk));
    const offExit = api.onExit((code) => {
      exitedRef.current = true;
      lineBufferRef.current = '';
      setRunning(false);
      term.writeln(`\r\n\x1b[90m[Процесс завершён: код ${code ?? '-'}]\x1b[0m`);
      term.writeln(
        `\x1b[90m${lang === 'ru' ? 'Нажмите Enter, чтобы начать заново' : 'Press Enter to restart'}\x1b[0m`,
      );
    });

    term.onData((data) => {
      if (exitedRef.current) {
        if (data === '\r' || data === '\n') {
          exitedRef.current = false;
          lineBufferRef.current = '';
          term.reset();
          setRunning(true);
          void api.spawn(optionsRef.current);
        }
        return;
      }

      for (const ch of data) {
        const code = ch.charCodeAt(0);

        if (ch === '\r' || ch === '\n') {
          term.write('\r\n');
          api.write(lineBufferRef.current + '\n');
          lineBufferRef.current = '';
        } else if (code === 0x7f || code === 0x08) {
          if (lineBufferRef.current.length > 0) {
            lineBufferRef.current = lineBufferRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 0x03) {
          // Ctrl+C — игнорируем
        } else if (code >= 0x20 && code < 0x7f) {
          lineBufferRef.current += ch;
          term.write(ch);
        }
      }
    });

    void api.spawn(optionsRef.current);
    setRunning(true);

    term.focus();
    requestAnimationFrame(() => term.focus());
    setTimeout(() => term.focus(), 100);
    term.textarea?.focus();

    const safeFit = () => { try { fit.fit(); } catch { /* ignore */ } };
    const onResize = () => safeFit();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(safeFit);
    ro.observe(containerRef.current);
    const t = window.setTimeout(safeFit, 50);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      offData();
      offExit();
      void api.kill();
      term.dispose();
      termRef.current = null;
    };
  }, [lang]);

  const handleRestart = useCallback(() => {
    const api = window.electronAPI?.terminal;
    const term = termRef.current;
    if (!api || !term) return;

    exitedRef.current = false;
    lineBufferRef.current = '';
    term.reset();

    void api.kill()
      .then(() => {
        setRunning(true);
        void api.spawn(optionsRef.current);
      })
      .finally(() => {
        term.focus();
        term.textarea?.focus();
      });
  }, []);

  const handleResetSave = useCallback(() => {
    const api = window.electronAPI?.terminal;
    const term = termRef.current;
    if (!api || !term) return;

    exitedRef.current = false;
    lineBufferRef.current = '';
    term.reset();

    void api.kill()
      .then(() => {
        setRunning(true);
        void api.spawn({ ...optionsRef.current, reset: true });
      })
      .finally(() => {
        term.focus();
        term.textarea?.focus();
      });
  }, []);

  if (notAvailable) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-2xl border border-default p-8"
        style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
      >
        {lang === 'ru'
          ? 'Блэкджек доступен только в десктопной версии.'
          : 'Blackjack is only available in the desktop version.'}
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-default"
      style={{ backgroundColor: '#0e1512', minHeight: 500 }}
    >
      <BlackjackSettings
        lang={lang}
        options={options}
        onChange={setOptions}
        onRestart={handleRestart}
        onResetSave={handleResetSave}
        running={running}
      />

      <div
        ref={containerRef}
        className="flex-1 w-full"
        style={{ padding: 8, height: 'calc(100vh - 220px)', minHeight: 400 }}
        onClick={() => { termRef.current?.focus(); termRef.current?.textarea?.focus(); }}
      />
    </div>
  );
};

export default TerminalView;
