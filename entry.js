
close_app.onclick = async () => {
    if (!await myconfirm('确定要关掉?')) return;
    window.close();
};


openlogin.onclick = () => {
    bxloginapi.open().then((v) => v && location.reload());
};
bxloginapi.getState().then(isLogged => {
    if (isLogged) {
        openlogin.innerText = '退出登录';
        openlogin.onclick = () => {
            openlogin.disabled = true;
            openlogin.innerText = '正在退出登录';
            bxloginapi.logout().then(() => location.reload());
        }
    }
    else openlogin.innerText = '登录';
    openlogin.disabled = false;
})


videoid_input.addEventListener('submit', ev => {
    ev.preventDefault();
    videolist_content.innerHTML = '正在加载...';

    openvideo.disabled = openvideo.innerText = '正在解析';
    const url = new URL('https://api.bilibili.com/x/web-interface/view');
    const vid = document.getElementById('vid').value;
    url.searchParams.set(vid_type.value, vid);
    webrequestapi.get(url.href).then(v => JSON.parse(v)).then(data => {
        globalThis.current_vid = vid;
        globalThis.video_data = data.data;
        console.log('video', vid, data);

        const pages = data.data.pages;
        videolist_content.innerHTML = '';
        for (const i of pages) {
            const el = document.createElement('div');
            el.className = 'res-list-item video-p-btn';
            el.role = 'button';
            el.tabIndex = 0;
            el.dataset.cid = i.cid;
            el.title = `cid: ${i.cid}`;
            const el1 = document.createElement('div');
            el1.className = 'res-list-content-container';
            el.append(el1);

            const elTitle = document.createElement('div');
            elTitle.className = 'res-list-content is-title';
            elTitle.innerText = elTitle.title = `${i.page}P. ${i.part} - ${data.data.title}`;
            el1.append(elTitle);

            videolist_content.append(el);

        }

        openvideo.disabled = !(openvideo.innerText = '打开');
    }).catch(async error => {
        await myalert('视频解析失败。' + error);
        videolist_content.innerHTML = '';
        openvideo.disabled = !(openvideo.innerText = '打开');
    });

});


entryinitapi.register(({ vid = null } = {}) => {
    console.log('vid=', vid);

    if (typeof vid === 'string') {
        if (vid.startsWith('av')) {
            vid_type.value = 'aid';
            vid = vid.substring(2);
            document.getElementById('vid').value = vid;
            videoid_input.dispatchEvent(new SubmitEvent('submit'));
        } else {
            document.getElementById('vid').value = vid;
            videoid_input.dispatchEvent(new SubmitEvent('submit'));
        }
    }
});


let currentPlaying = null;

videolist_content.addEventListener('click', async function (ev) {
    const vid = current_vid;
    const cid = (() => {
        for (const i of ev.composedPath()) {
            if (i?.classList?.contains('video-p-btn') && i?.dataset?.cid) {
                return i.dataset.cid;
            }
        }
        return null;
    })();
    if (!cid) return //myalert('找不到cid');

    currentPlaying = cid;
    await bxapi.play(vid, cid);
});

videolist_content.addEventListener('keydown', async function (ev) {
    if (ev.key !== 'Enter') return;
    const vid = current_vid;
    const cid = (() => {
        for (const i of ev.composedPath()) {
            if (i?.classList?.contains('video-p-btn') && i?.dataset?.cid) {
                return i.dataset.cid;
            }
        }
        return null;
    })();
    if (!cid) return //myalert('找不到cid');

    currentPlaying = +cid;
    await bxapi.play(vid, cid);
});


autoPlay.disabled = true;
bxapi.autoPlayOptions().then(result => {
    autoPlay.checked = result;
    autoPlay.disabled = false;
});
autoPlay.oninput = async () => {
    autoPlay.disabled = true;
    await bxapi.autoPlayOptions(autoPlay.checked)
    autoPlay.disabled = false;
};


bxplay.onPlayEnded(function () {
    if (!autoPlay.checked) return;
    globalThis.video_data.pages;
    for (let i = 0, l = globalThis.video_data.pages.length; i < l; ++i){
        if (globalThis.video_data.pages[i].cid == currentPlaying) {
            const nextVideo = globalThis.video_data.pages[i + 1];
            if (!nextVideo) return;
            const nextCid = nextVideo.cid;
            videolist_content.querySelector(`[data-cid="${nextCid}"]`)?.scrollIntoView();
            currentPlaying = nextCid;
            bxapi.play(current_vid, nextCid);
            break;
        }
    }
});

