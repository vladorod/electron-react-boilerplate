/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain, Menu, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';
import progress from 'progress-stream';
import axios from 'axios';
import { resolveHtmlPath } from './util';
// import { resolveHtmlPath } from './util';

let tray: Tray | null;
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow ;

const getAssetPath = (...paths: string[]): string => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  return path.join(RESOURCES_PATH, ...paths);
};

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    frame: false,
    autoHideMenuBar: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      webviewTag: true,
      javascript: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  // mainWindow.loadURL(resolveHtmlPath('index.html'));
  // Когда сайт загружен, добавляем HTML

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    tray = null;

    app.quit();
  });

  ipcMain.on('minimize_window', () => {
    if (mainWindow instanceof BrowserWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('fullScreen_window', () => {
    const isFullScreen = mainWindow.isFullScreen();
    if (mainWindow instanceof BrowserWindow) {
      mainWindow.setFullScreen(!isFullScreen);
    }
  });

  ipcMain.on('close_window', () => {
    if (mainWindow instanceof BrowserWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.on('get-file-path', (event) => {
    if (isDebug) {
      event.returnValue = path.resolve(app.getAppPath(), '..');
    } else {
      event.returnValue = process.env.PORTABLE_EXECUTABLE_DIR;
    }
  });

  ipcMain.on('show-error', (event, error) => {
    dialog
      .showMessageBox({
        type: 'error',
        title: 'Application Error',
        message: error.toString(),
        buttons: ['OK'],
      })
      .then((result) => {
        if (result.response === 0) {
          app.quit();
        }
      });
  });

  ipcMain.on('show-warn', (event, error) => {
    dialog.showMessageBox({
      type: 'warning',
      title: 'Application Warning',
      message: error.toString(),
      buttons: ['OK'],
    });
  });

  ipcMain.on('download', async (event, data) => {
    const { url, options } = data;

    try {
      // Ставим заголовок, чтобы сервер вернул Content-Length
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        headers: {
          'Accept-Encoding': 'identity',
        },
      });

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
      console.log('HEADERS:', response.headers);

      const str = progress({
        length: totalBytes,
        time: 100,
      });

      str.on('progress', (progressData) => {
        const status = {
          percent: totalBytes ? progressData.percentage / 100 : 0,
          transferredBytes: progressData.transferred,
          totalBytes,
        };
        mainWindow.send('download progress', status);
      });

      // Собираем путь к файлу
      const { directory } = options;
      const filePath = path.join(directory, options.filename);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const writer = fs.createWriteStream(filePath);

      response.data
        .pipe(str)
        .pipe(writer)
        .on('finish', () => {
          console.log('Download complete:', filePath);
          switch (options.step) {
            case 'launcher':
              mainWindow.send('download launcher complete');
              break;
            case 'client':
              mainWindow.send('download client complete');
              break;
            case 'patch':
              mainWindow.send('download patch complete');
              break;
            default:
              mainWindow.send('download default complete');
          }
        })
        .on('error', (err) => {
          console.error('File write failed:', err);
          mainWindow.send('download error');
        });
    } catch (err) {
      console.error('Axios download failed:', err);
      mainWindow.send('download error');
    }
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();
  //
  // // Open urls in the user's browser
  // mainWindow.webContents.setWindowOpenHandler((edata) => {
  //   shell.openExternal(edata.url);
  //   return { action: 'deny' };
  // });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    const iconPath = getAssetPath('icons', '36x36.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Открыть',
        click: () => {
          mainWindow.show(); // Показывает окно
        },
      },
      {
        label: 'Выйти',
        click: () => {
          mainWindow.close(); // Закрывает окно
        },
      },
    ]);

    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.focus(); // Если окно уже открыто, фокусируем его
      } else {
        mainWindow.show(); // Если окно скрыто, показываем его
      }
    });

    tray.setToolTip('Punch');
    tray.setContextMenu(contextMenu);

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
