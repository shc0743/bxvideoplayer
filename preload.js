const { contextBridge, ipcRenderer } = require('electron')



contextBridge.exposeInMainWorld('bxloginapi', {
    open() { return ipcRenderer.invoke('bxloginapi.open') },
    logout() { return ipcRenderer.invoke('bxloginapi.logout') },
    getState() { return ipcRenderer.invoke('bxloginapi.getState') },
})

contextBridge.exposeInMainWorld('webrequestapi', {
    get(url) { return ipcRenderer.invoke('webrequestapi.get', url) },
})

contextBridge.exposeInMainWorld('entryinitapi', {
    register(fn) { return ipcRenderer.invoke('entry::initWindow').then(fn) },
})

contextBridge.exposeInMainWorld('myalert', function (text, title) {
    return ipcRenderer.invoke('alertMessageWidget', text, title);
})
contextBridge.exposeInMainWorld('myconfirm', function (text, title) {
    return ipcRenderer.invoke('alertMessageWidget', text, title, 'confirm');
})


contextBridge.exposeInMainWorld('bxapi', {
    play(vid, cid) { return ipcRenderer.invoke('bxapi.play', vid, cid) },
    web(url) { return ipcRenderer.invoke('bxapi.web', url) },
    autoPlayOptions(newValue = null) { return ipcRenderer.invoke('bxapi.autoPlayOptions', newValue) },
    switchToEntry() { return ipcRenderer.invoke('bxapi.switchToEntry') },
    getDispatchAutoOpenOption() { return ipcRenderer.invoke('bxapi.getDispatchAutoOpenOption') },
})


contextBridge.exposeInMainWorld('bxplay', {
    listen(cb) { return ipcRenderer.on('play_window.load_info', cb) },
    getinfo() { return ipcRenderer.invoke('bxplay.getif') },
    applyPlay() { return ipcRenderer.invoke('bxplay.applyPlay') },
    playEnded() { return ipcRenderer.invoke('bxplay.playEnded') },
    onPlayEnded(cb) { return ipcRenderer.on('bxplay.playEnded', cb) },
})





