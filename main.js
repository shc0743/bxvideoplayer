
const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron')
const path = require('path');
const url = require('url');
const fs = require('fs');
const minimist = require('minimist');
const USER_AGENT_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';



const args = minimist(process.argv);
let userAgent = args.userAgent || USER_AGENT_CHROME || null; // default chrome ua to avoid Bilibili detection




const createEntryWindow = async () => {
    const win = new BrowserWindow({
        width: 640,
        height: 480,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
    })
    globalThis.entryWindow = win;
    
    await win.loadFile('entry.html');
    if (userAgent) win.webContents.setUserAgent(userAgent);

    win.on('closed', () => app.quit());
}

const createOrLoadPlayWindow = async (vid, cid) => {
    if (globalThis.playWindow) {
        if (!(globalThis.playWindow.vid === vid && globalThis.playWindow.cid === cid)) {
            globalThis.playWindow.vid = vid;
            globalThis.playWindow.cid = cid;
            globalThis.playWindow.webContents.send('play_window.load_info');
        }
        globalThis.playWindow.focus();
        return globalThis.playWindow;
    }

    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            autoplayPolicy: 'no-user-gesture-required',
        },
        autoHideMenuBar: true,
    })
    globalThis.playWindow = win;
    globalThis.playWindow.vid = vid;
    globalThis.playWindow.cid = cid;

    nativeTheme.themeSource = 'dark';

    await win.loadFile('play.html');
    if (userAgent) win.webContents.setUserAgent(userAgent);
    // await p;

    win.on('closed', () => ((globalThis.playWindow = null), (nativeTheme.themeSource = 'light')));
    // win.webContents.send('play_window.load_info');

}

const createLoginWindow = function createLoginWindow() {
    return new Promise(resolve => {
        if (createEntryWindow.__obj) try {
            createEntryWindow.__obj.focus();
            return resolve();
        } catch { createEntryWindow.__obj = null; }
        const obj = new BrowserWindow({
            width: 1024,
            height: 768,
            autoHideMenuBar: true
        });
        createEntryWindow.__obj = obj;
        createLoginWindow.__period = 1;
        obj.loadURL('https://passport.bilibili.com/login').then(() => {
            obj.on('close', () => {
                createLoginWindow.__obj = null
                resolve(false);
            });
            const fn = () => {
                const title = obj.webContents.getTitle();
                // console.log(title)
                if (!(/登录/.test(title))) {
                    if (createLoginWindow.__period == 2) {
                        resolve(true);
                        obj.close();
                    }
                } else {
                    createLoginWindow.__period = 2;
                }
            }
            obj.on('page-title-updated', fn);
            queueMicrotask(fn);
        
        });
    });
}


const bxapiWebView = async function (url) {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        autoHideMenuBar: true,
        webPreferences: {
            autoplayPolicy: 'document-user-activation-required'
        }
    });
    // console.log(ev.senderFrame);
    const promise = win.loadURL(url)
    win.webContents.setWindowOpenHandler((details) => {
        bxapiWebView(details.url)
        return { action: 'deny' };
    });
    await promise
    return win;
}


const ipcHandlers = {
    'bxloginapi.open': createLoginWindow,
    'bxloginapi.logout': () => new Promise(async (resolve) => {
        const win = new BrowserWindow({
            width: 1,
            height: 1,
            frame: false,
            opacity: 0,
            focusable: false,
            webSecurity: false
        });
        await win.loadURL('https://passport.bilibili.com/login/exit/v2', {
            postData: []
        })
        await win.webContents.session.clearStorageData({ storages: ['cookies'] });
        win.destroy();
        resolve();
    }),
    'bxloginapi.getState': () => new Promise(async (resolve) => {
        const win = new BrowserWindow({
            width: 1,
            height: 1,
            frame: false,
            opacity: 0,
            focusable: false,
        });
        // setTimeout(() => {
        //     win.destroy();
        //     resolve(false);
        // }, 10000);
        await win.loadURL('https://api.bilibili.com/x/kv-frontend/namespace/data');
        try {
            const dede = ((await win.webContents.session.cookies.get({ name: 'DedeUserID', domain: '.bilibili.com' }))[0].value);
            // win.destroy();
            resolve(!!dede)
        } catch { resolve(false) }
        win.destroy();
    }),
    'webrequestapi.get'(ev, url) {
        // console.dir(url)
        // console.log('fetching url: ' + url);
        return new Promise((resolve, reject) => {
            // console.log('request ', url)
            fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                }
            }).then(v => v.text()).then(resolve).catch(reject);
        });
    },
    'entry::initWindow'() {
        let vid = args.video;
        if (!vid) vid = process.argv[1];
        if (vid === '.') vid = process.argv[2];
        if (vid.startsWith('-')) vid = args.video; // don't parse options as video
        let title = args.title || null;
        return { vid, title };
    },
    'alertMessageWidget': (ev, message, title, type) => new Promise(async resolve => {
        const win = new BrowserWindow({
            width: 500,
            height: 300,
            webPreferences: {
                preload: path.join(__dirname, 'alertMessageWidget.preload.js')
            },
            autoHideMenuBar: true,
            titleBarStyle: 'hidden',
            titleBarOverlay: true,
        });
        // console.log(ev.senderFrame);
        await win.loadFile('alertMessageWidget.html');
        title = title || app.name;
        win.webContents.send('alertMessageWidget', message, title, type === 'confirm' ? 'confirm' : 'alert');
        win.webContents.ipc.on('alertMessageWidget-reply', (ev, result) => {
            resolve(result);
            win.destroy();
        });
        win.on('closed', () => resolve(false));
    }),
    async 'bxapi.play'(ev, vid, cid) {
        createOrLoadPlayWindow(vid, cid);
    },
    async 'bxapi.web'(ev, url) {
        await bxapiWebView(url)
        return true
    },
    async 'bxplay.getif'() {
        return {
            vid: globalThis.playWindow.vid,
            cid: globalThis.playWindow.cid,
            
        };
    },
    'bxapi.autoPlayOptions': (ev, param) => new Promise(async (resolve) => {
        if (typeof param === 'boolean') {
            if (!param) fs.unlink('autoplay=enabled', () => resolve(false));
            else fs.writeFile('autoplay=enabled', 'true', () => resolve(true));
            return;
        }
        fs.access('autoplay=enabled', (err) => {
            resolve(!err);
        });
    }),
    'bxapi.switchToEntry'() {
        globalThis.entryWindow.focus();
    },
    // 'bxplay.applyPlay'() {
    //     globalThis.playWindow.webContents.executeJavaScript(`document.getElementById('video').play()`, true);
    // },
    'bxplay.playEnded'() {
        globalThis.entryWindow.webContents.send('bxplay.playEnded');
    },
    'bxapi.getDispatchAutoOpenOption'() {
        const p = args.p;
        return {
            vid: ipcHandlers['entry::initWindow']().vid,
            p,
        };
    },
};

nativeTheme.themeSource = 'light';



app.whenReady().then(() => {

    for (const i in ipcHandlers)
        ipcMain.handle(i, ipcHandlers[i]);



    createEntryWindow();
    

});




// quitting the app when no windows are open on non-macOS platforms
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})



