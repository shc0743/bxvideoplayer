const { contextBridge, ipcRenderer } = require('electron')



contextBridge.exposeInMainWorld('alertMessageWidget', {
    listen(cb) {
        ipcRenderer.on('alertMessageWidget', cb);
    },
    sendResult(result) {
        ipcRenderer.send('alertMessageWidget-reply', result)
    },
})
