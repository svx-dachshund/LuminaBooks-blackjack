import React, { useState } from 'react';
import { NumberInput, Switch } from '@mantine/core';
import { ChevronDown, ChevronRight, Trash2, Play, FileText } from 'lucide-react';
import type { BlackjackOptions } from '../electron.d';

interface BlackjackSettingsProps {
  lang: 'en' | 'ru';
  options: BlackjackOptions;
  onChange: (options: BlackjackOptions) => void;
  onRestart: () => void;
  onResetSave: () => void;
  running: boolean;
}

const BlackjackSettings: React.FC<BlackjackSettingsProps> = ({
  lang,
  options,
  onChange,
  onRestart,
  onResetSave,
  running,
}) => {
  const [expanded, setExpanded] = useState(false);

  const patch = (partial: Partial<BlackjackOptions>) => {
    onChange({ ...options, ...partial });
  };

  const labelCls = 'text-xs font-medium mb-1 block';
  const labelStyle: React.CSSProperties = { color: 'var(--muted)' };

  const btnBase =
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
  const btnStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 p-2"
           style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={btnBase}
          style={btnStyle}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {lang === 'ru' ? 'Настройки запуска' : 'Launch options'}
        </button>

        <button
          onClick={onRestart}
          className={btnBase}
          style={btnStyle}
          title={lang === 'ru' ? 'Перезапустить с текущими настройками' : 'Restart with current options'}
        >
          <Play size={14} />
          {lang === 'ru' ? 'Применить и перезапустить' : 'Apply & restart'}
        </button>

        <button
          onClick={() => void window.electronAPI?.terminal?.openLog()}
          className={btnBase}
          style={btnStyle}
          title={lang === 'ru' ? 'Открыть файл журнала' : 'Open log file'}
        >
          <FileText size={14} />
          {lang === 'ru' ? 'Лог' : 'Log'}
        </button>

        <button
          onClick={onResetSave}
          className={btnBase}
          style={{ ...btnStyle, color: 'var(--danger)', borderColor: 'var(--danger)' }}
          title={lang === 'ru' ? 'Удалить сохранение и начать с нуля' : 'Delete save and start fresh'}
        >
          <Trash2 size={14} />
          {lang === 'ru' ? 'Сбросить сохранение' : 'Reset save'}
        </button>

        {running && (
          <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
            ● {lang === 'ru' ? 'Игра запущена' : 'Game running'}
          </span>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-5"
             style={{ backgroundColor: 'color-mix(in oklab, var(--surface), transparent 5%)',
                      borderBottom: '1px solid var(--border)' }}>
          <div>
            <label className={labelCls} style={labelStyle}>
              {lang === 'ru' ? 'Баланс игрока' : 'Player balance'}
            </label>
            <NumberInput
              value={options.player ?? ''}
              onChange={(v) => patch({ player: typeof v === 'number' ? v : undefined })}
              min={1}
              step={100}
              placeholder="1000"
              size="xs"
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              {lang === 'ru' ? 'Баланс казино' : 'Dealer balance'}
            </label>
            <NumberInput
              value={options.dealer ?? ''}
              onChange={(v) => patch({ dealer: typeof v === 'number' ? v : undefined })}
              min={1}
              step={100}
              placeholder="5000"
              size="xs"
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              {lang === 'ru' ? 'Число колод' : 'Decks'}
            </label>
            <NumberInput
              value={options.decks ?? ''}
              onChange={(v) => patch({ decks: typeof v === 'number' ? v : undefined })}
              min={1}
              max={8}
              placeholder="4"
              size="xs"
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              {lang === 'ru' ? 'Скорость дилера (мс)' : 'Dealer speed (ms)'}
            </label>
            <NumberInput
              value={options.speed ?? ''}
              onChange={(v) => patch({ speed: typeof v === 'number' ? v : undefined })}
              min={0}
              step={100}
              placeholder="800"
              size="xs"
            />
          </div>

          <div className="flex items-end">
            <Switch
              checked={!!options.log}
              onChange={(e) => patch({ log: e.currentTarget.checked })}
              label={lang === 'ru' ? 'Логирование' : 'Logging'}
              size="xs"
            />
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-5 text-xs rounded-lg p-2"
               style={{ backgroundColor: 'color-mix(in oklab, var(--warn, #EAB308) 12%, transparent)',
                        color: 'var(--fg)' }}>
            {lang === 'ru'
              ? 'Балансы игрока и казино применяются только при отсутствии сохранения. Чтобы начать с новыми балансами, нажмите «Сбросить сохранение».'
              : 'Player and dealer balances apply only when there is no save file. To start with new balances, click "Reset save".'}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackjackSettings;
