
const is_touch_device = !!navigator.maxTouchPoints;



import { LoadingApp } from './LoadingApp.js';


globalThis.loadingApp = new LoadingApp();
loadingApp._sr.adoptedStyleSheets.push(await (new CSSStyleSheet().replace('.LoadingApp { z-index: 3; }')))


import { createApp } from 'vue';
const app = createApp((await import('./play.vue.js')).default);
{
    const element = await import('./3p/element-plus/index.full.mjs.js');
    for (const i in element) {
        if (i.startsWith('El')) app.component(i, element[i]);
    }
}
app.mount(document.getElementById('app'));
const { ElMessage, ElMessageBox } = await import('./3p/element-plus/index.full.mjs.js');


document.body.addEventListener('fullscreenchange', function (ev) {
    globalThis.instance_.isFullscreen = !!(document.fullscreenElement);
})


await new Promise(r => setTimeout(r, 1000));
const LoadVideoInfo = async function () {
    
    const { vid, cid } = await bxplay.getinfo();
    if (String(globalThis.instance_.cid) === cid && globalThis.current_vid === vid) {
        return;
    }
    globalThis.instance_.video_information.title = '正在加载...';
    globalThis.video_data = null;
    globalThis.instance_.video_data2 = {};

    try {
        const url = new URL('https://api.bilibili.com/x/web-interface/view');
        url.searchParams.set((vid.toUpperCase()).startsWith('BV') ? 'bvid' : 'aid', vid);
        const vdata = await (webrequestapi.get(url.href).then(v => JSON.parse(v)));
        console.log('video data:' , vdata);
        globalThis.video_data = vdata.data;

        globalThis.instance_.video_information.title = vdata.data.title;
        globalThis.instance_.video_data2 = vdata.data;
        globalThis.instance_.cid = +cid;
        globalThis.current_vid = vid;

    } catch (error) {
        ElMessage.error('视频信息加载失败: ' + error);
    }

}
bxplay.listen(LoadVideoInfo);
queueMicrotask(LoadVideoInfo);



// const appControls = document.getElementById('app-controls');

// ticks.ontick(function () {
//     console.log(arguments[0], arguments[1]);
// });
// appControls.addEventListener('mousemove', function () {
//     ticks.reset(this);
// });


if (0) (function () {
    // https://zh.javascript.info/pointer-events
    const slider = document.getElementById('slider-b3a174b2-4cfe-4353-8dc0-00b450aa2806');
    const thumb = slider.querySelector('.thumb-b3a174b2-4cfe-4353-8dc0-00b450aa2806');
    let shiftX;

    function onThumbDown(event) {
        event.preventDefault(); // 阻止开始选择（浏览器行为）

        shiftX = event.clientX - thumb.getBoundingClientRect().left;

        thumb.setPointerCapture(event.pointerId);

        thumb.onpointermove = onThumbMove;

        thumb.onpointerup = event => {
            // 拖动结束，不再需要跟踪指针
            // ...这里还可以处理“拖动结束”相关的逻辑
            thumb.onpointermove = null;
            thumb.onpointerup = null;
        }
    };

    function onThumbMove(event) {
        let newLeft = event.clientX - shiftX - slider.getBoundingClientRect().left;

        // 如果指针移出了滑块 => 调整 left 来防止其超出边界
        if (newLeft < 0) {
            newLeft = 0;
        }
        let rightEdge = slider.offsetWidth - thumb.offsetWidth;
        if (newLeft > rightEdge) {
            newLeft = rightEdge;
        }

        thumb.style.left = newLeft + 'px';
    };

    thumb.onpointerdown = onThumbDown;

    thumb.ondragstart = () => false;

}());


