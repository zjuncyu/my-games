const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const ffi = require('ffi-napi');

function createWindow() {
    // 获取主屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const win = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        skipTaskbar: true,
        hasShadow: false,
        focusable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 设置窗口为点击穿透
    win.setIgnoreMouseEvents(true, { forward: true });
    
    // 只有在控制按钮区域才能接收鼠标事件
    win.webContents.on('dom-ready', () => {
        win.webContents.executeJavaScript(`
            document.querySelector('.controls').addEventListener('mouseenter', () => {
                require('electron').ipcRenderer.send('set-ignore-mouse-events', false);
            });
            document.querySelector('.controls').addEventListener('mouseleave', () => {
                require('electron').ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
            });
        `);
    });

    // Windows 平台特殊处理
    if (process.platform === 'win32') {
        // 发送 0x052C 到 Progman，这会创建 WorkerW
        exec('REG ADD "HKCU\\Control Panel\\Desktop" /v WallpaperStyle /t REG_SZ /d 0 /f');
        
        const user32 = require('ffi-napi').Library('user32', {
            'EnumWindows': ['bool', ['pointer', 'int32']],
            'FindWindowExA': ['pointer', ['pointer', 'pointer', 'string', 'string']],
            'SendMessageTimeoutA': ['long', ['pointer', 'uint32', 'uint32', 'uint32', 'uint32', 'uint32', 'pointer']],
            'SetParent': ['long', ['long', 'long']]
        });

        const workerW = Buffer.alloc(8);
        
        // 查找 WorkerW 窗口
        function findWorkerW() {
            return new Promise((resolve) => {
                const enumWindowsCallback = ffi.Callback('bool', ['pointer', 'int32'], (hwnd) => {
                    const workerWCheck = user32.FindWindowExA(hwnd, null, 'SHELLDLL_DefView', null);
                    if (workerWCheck) {
                        const worker = user32.FindWindowExA(null, hwnd, 'WorkerW', null);
                        if (worker) {
                            workerW.writePointer(worker, 0);
                            return false;
                        }
                    }
                    return true;
                });

                // 发送消息给 Progman
                const progman = user32.FindWindowExA(null, null, 'Progman', null);
                user32.SendMessageTimeoutA(progman, 0x052C, 0, 0, 0, 1000, null);
                
                // 枚举窗口找到 WorkerW
                user32.EnumWindows(enumWindowsCallback, 0);
                
                resolve(workerW.readPointer(0));
            });
        }

        // 设置窗口父级为 WorkerW
        win.once('ready-to-show', async () => {
            const workerWHwnd = await findWorkerW();
            if (workerWHwnd) {
                user32.SetParent(win.getNativeWindowHandle(), workerWHwnd);
            }
        });
    }

    win.loadFile('index.html');
}

// 处理鼠标事件切换
const { ipcMain } = require('electron');
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    BrowserWindow.fromWebContents(event.sender).setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 