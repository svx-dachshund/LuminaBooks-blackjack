const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',

  getServerUrl: () => ipcRenderer.invoke('server:getUrl'),

  getLoginItemSettings: () => ipcRenderer.invoke('app:getLoginItemSettings'),
  setLoginItemSettings: (settings) => ipcRenderer.invoke('app:setLoginItemSettings', settings),
  openExternalUrl: (url) => ipcRenderer.invoke('app:openExternalUrl', url),

  db: {
    getAllBooks: () => ipcRenderer.invoke('db:getAllBooks'),
    addBook: (book) => ipcRenderer.invoke('db:addBook', book),
    updateBook: (book) => ipcRenderer.invoke('db:updateBook', book),
    deleteBook: (id) => ipcRenderer.invoke('db:deleteBook', id),

    getAllFranchises: () => ipcRenderer.invoke('db:getAllFranchises'),
    addFranchise: (franchise) => ipcRenderer.invoke('db:addFranchise', franchise),
    updateFranchise: (franchise) => ipcRenderer.invoke('db:updateFranchise', franchise),
    deleteFranchise: (id) => ipcRenderer.invoke('db:deleteFranchise', id),

    getUserProfile: () => ipcRenderer.invoke('db:getUserProfile'),
    setUserProfile: (profile) => ipcRenderer.invoke('db:setUserProfile', profile),
    mergeUserAchievements: (achievements) => ipcRenderer.invoke('db:mergeUserAchievements', achievements),

    migrate: () => ipcRenderer.invoke('db:migrate'),

    searchBooksDictionary: (title, author) => ipcRenderer.invoke('db:searchBooksDictionary', title, author),
    saveToBooksDictionary: (entry) => ipcRenderer.invoke('db:saveToBooksDictionary', entry),
  },
  terminal: {
    spawn: (options) => ipcRenderer.invoke("terminal:spawn", options),
    write: (data) => ipcRenderer.send('terminal:write', data),
    kill: () => ipcRenderer.invoke('terminal:kill'),
    openLog: () => ipcRenderer.invoke('terminal:openLog'),
    onData: (cb) => {
      const handler = (_event, chunk) => cb(chunk);
      ipcRenderer.on('terminal:data', handler);
      return () => ipcRenderer.removeListener('terminal:data', handler);
    },
    onExit: (cb) => {
      const handler = (_event, code) => cb(code);
      ipcRenderer.on('terminal:exit', handler);
      return () => ipcRenderer.removeListener('terminal:exit', handler);
    },
  },
});

document.addEventListener('DOMContentLoaded', () => {
  let lastFocusedElement = null;

  const isXterm = (el) =>
    !!el && !!el.classList && el.classList.contains('xterm-helper-textarea');

  document.addEventListener('focusin', (e) => {
    lastFocusedElement = e.target;
  }, true);

  document.addEventListener('keydown', () => {
    const activeEl = document.activeElement;
    if (isXterm(activeEl) || isXterm(lastFocusedElement)) return;

    if (lastFocusedElement &&
        (activeEl === document.body || !['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) &&
        ['INPUT', 'TEXTAREA'].includes(lastFocusedElement.tagName)) {
      lastFocusedElement.focus();
    }
  }, true);

  document.addEventListener('click', () => {
    const activeEl = document.activeElement;
    if (isXterm(activeEl) || isXterm(lastFocusedElement)) return;
    if (activeEl === document.body && lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }, true);
});
