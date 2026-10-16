import { spawn, ChildProcess } from 'child_process';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface BlackjackOptions {
  reset?: boolean;
  log?: boolean;
  player?: number;
  dealer?: number;
  decks?: number;
  speed?: number;
}

let child: ChildProcess | null = null;
let generation = 0;

function getBinaryName(): string {
  if (process.platform === 'win32') return 'blackjack-win.exe';
  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'blackjack-mac-arm' : 'blackjack-mac';
  }
  return 'blackjack-linux';
}

function getBinaryPath(): string {
  const name = getBinaryName();
  if (!app.isPackaged) {
    return join(app.getAppPath(), 'blackjack', name);
  }
  return join(process.resourcesPath, 'blackjack', name);
}

function getWorkingDir(): string {
  const dir = join(app.getPath('userData'), 'blackjack-data');
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
  return dir;
}

function safeSend(win: BrowserWindow, channel: string, payload: unknown): void {
  if (win.isDestroyed()) return;
  win.webContents.send(channel, payload);
}

function buildArgs(options: BlackjackOptions): string[] {
  const args: string[] = [];
  if (options.reset) args.push('-reset');
  if (options.log) args.push('-log');
  if (typeof options.player === 'number' && Number.isFinite(options.player) && options.player > 0) {
    args.push('-player', String(Math.floor(options.player)));
  }
  if (typeof options.dealer === 'number' && Number.isFinite(options.dealer) && options.dealer > 0) {
    args.push('-dealer', String(Math.floor(options.dealer)));
  }
  if (typeof options.decks === 'number' && Number.isFinite(options.decks) && options.decks > 0) {
    args.push('-decks', String(Math.floor(options.decks)));
  }
  if (typeof options.speed === 'number' && Number.isFinite(options.speed) && options.speed >= 0) {
    args.push('-speed', String(Math.floor(options.speed)));
  }
  return args;
}

export function spawnBlackjack(win: BrowserWindow, options: BlackjackOptions = {}): void {
  if (child) {
    safeSend(win, 'terminal:data', '\r\n\x1b[90m[Процесс уже запущен]\x1b[0m\r\n');
    return;
  }

  const binary = getBinaryPath();
  if (!existsSync(binary)) {
    safeSend(
      win,
      'terminal:data',
      `\r\n\x1b[31m[Бинарник не найден: ${binary}]\x1b[0m\r\n` +
        `\x1b[90mСоберите его согласно blackjack/README.md\x1b[0m\r\n`,
    );
    return;
  }

  const args = buildArgs(options);
  const myGen = ++generation;

  try {
    child = spawn(binary, args, {
      cwd: getWorkingDir(),
      env: { ...process.env, TERM: 'xterm-256color' },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  } catch (err) {
    safeSend(win, 'terminal:data', `\r\n\x1b[31m[Не удалось запустить: ${String(err)}]\x1b[0m\r\n`);
    child = null;
    return;
  }

  const spawned = child;

  if (args.length > 0) {
    safeSend(win, 'terminal:data', `\x1b[90m[Запуск: blackjack ${args.join(' ')}]\x1b[0m\r\n`);
  }

  const forward = (chunk: Buffer) => {
    safeSend(win, 'terminal:data', chunk.toString('utf8'));
  };

  spawned.stdout?.on('data', forward);
  spawned.stderr?.on('data', forward);

  spawned.on('error', (err) => {
    if (child === spawned) child = null;
    safeSend(win, 'terminal:data', `\r\n\x1b[31m[Ошибка процесса: ${err.message}]\x1b[0m\r\n`);
  });

  spawned.on('exit', (code, signal) => {
    if (child === spawned) child = null;
    if (myGen !== generation) return;
    safeSend(
      win,
      'terminal:data',
      `\r\n\x1b[90m[Процесс завершён: код=${code ?? '-'}, сигнал=${signal ?? '-'}]\x1b[0m\r\n`,
    );
    safeSend(win, 'terminal:exit', code);
  });
}

export function writeToBlackjack(data: string): void {
  if (!child || !child.stdin || child.stdin.destroyed) return;
  const normalized = data.replace(/\r(?!\n)/g, '\n');
  child.stdin.write(normalized);
}

export function killBlackjack(): void {
  if (!child) return;
  try {
    child.kill();
  } catch {
    // ignore
  }
  child = null;
}
