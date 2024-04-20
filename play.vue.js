
import { ElMessage, ElMessageBox } from './3p/element-plus/index.full.mjs.js';
import TextEdit from './TextEdit/TextEdit.js';



import { TickManager } from './TickManager.js';
const ticks = new TickManager(500);



const componentId = 'b0259a8cca2b481d9186cfc752839d04';
export { componentId };



const data = {
    data() {
        return {
            video_progress_realvalue: 0,
            video_progress_total: 9999,
            video_volume: 1,
            isFullscreen: false,
            video_information: {},
            video_data2: {},
            video_speed: 1,
            cid_value: '',
            cdata: {},
            isPaused: true,
            playData: {},
            appControlsActive: true,
            last_videoloading_state: null,

        };
    },

    components: {
        TextEdit,

    },

    computed: {
        video_progress: {
            get() {
                return this.video_progress_realvalue
            },
            set(value) {
                this.video_progress_realvalue = value;
                if (Math.floor(video.currentTime) !== value) {
                    // video.pause();
                    video.currentTime = value;
                    // ticks.nextTick(() => video.play());
                }
                return true;
            }
        },
        video_progress_text: {
            get() {
                return this.formatTimeParamter(Math.floor(this.video_progress))
            },
            set(value) {
                const timedArray = value.split(':');
                if (timedArray.length < 1 || timedArray.length > 3) myalert('参数错误。');
                let h = 0, m, s;
                if (timedArray.length == 3) {
                    h = +timedArray[0];
                    m = +timedArray[1];
                    s = +timedArray[2];
                } else {
                    m = +timedArray[0];
                    s = +timedArray[1];
                }
                const p = h * 3600 + m * 60 + s;
                if (isNaN(p) || p < 0 || p > this.video_progress_total) {
                    return !myalert('输入无效');
                }
                this.video_progress = p;
                return true;
            }
        },
        video_volume__composed: {
            get() {
                return Math.floor(this.video_volume * 100)
            },
            set(value) {
                this.video_volume = value / 100;
                return true;
            }
        },
        cid: {
            get() { return this.cid_value },
            set(value) {
                this.cid_value = value;

                (() => {
                    for (const i of globalThis.video_data.pages) {
                        if (i.cid !== this.cid) continue;
                        this.cdata = i;
                        if (globalThis.video_data.pages.length > 1) // 只对多P视频显示分P标题
                            this.video_information.title = `${i.page}P. ${i.part} - ` + this.video_information.title;
                        this.video_progress = 0;
                        this.video_progress_total = i.duration;

                        this.prepareVideo();
                        return;
                    }
                    ElMessage.error('视频加载失败：cid不存在')
                })();

                return true;
            },
        },
        
    },

    provide() {
        return {
            
        }
    },

    methods: {
        formatTimeParamter(tt) {
            function fillzero(str) { return str.length < 2 ? ('0' + str) : str }
            return `${fillzero(String(Math.floor(tt / 60)))}:${fillzero(String(tt % 60))}`
        },
        toggleFullscreen() {
            this.isFullscreen ? document.exitFullscreen() : document.body.requestFullscreen();
        },
        showDetails(obj) {
            myalert(typeof obj === 'string' ? obj : (JSON.stringify(obj || globalThis.video_data, null, 4)), obj ? '视频信息' : (globalThis.video_data?.bvid + ' 视频的详细信息'));
        },
        showUploader() {
            if (!this.video_data2.owner) return;
            bxapi.web('https://space.bilibili.com/' + this.video_data2.owner.mid)
        },
        showVideoPic() {
            if (!this.video_data2.pic) return;
            bxapi.web(this.video_data2.pic)
        },
        showBiliLink(showOnly) {
            const link = `https://www.bilibili.com/video/${this.video_data2.bvid}`;
            if (showOnly) myalert(link);
            else bxapi.web(link);
        },
        openEntryWindow() {
            bxapi.switchToEntry();  
        },
        pauseOrPlay(direction = null) {
            if (direction instanceof Event) direction = null;
            if (direction) {
                return video[direction]();
            }
            this.isPaused ? video.play() : video.pause();
        },
        setVideoParamters() {
            video.playbackRate = this.video_speed;
            video.volume = this.video_volume;
        },
        updateVideoTime() {
            this.video_progress_realvalue = video.currentTime;
            this.videoloading(false);
        },
        videoloading(p) {
            if (this.last_videoloading_state === p) return; // 忽略重复消息
            this.last_videoloading_state = p;
            if (p) loadingApp.show();
            else loadingApp.hide();
        },
        onpointermove() {
            ticks.reset(this);
            if (!this.appControlsActive) this.appControlsActive = true;
        },
        onkeydown(ev) {
            const key = ev.key;
            switch (key) {
                case 'ArrowLeft':
                    video.pause();
                    this.video_progress = Math.max(0, this.video_progress - 5);
                    ticks.nextTick(() => video.play());
                    break;
                case 'ArrowRight':
                    video.pause();
                    this.video_progress = Math.min(this.video_progress_total, this.video_progress + 5);
                    ticks.nextTick(() => video.play());
                    break;
                case ' ':
                    this.pauseOrPlay();
                    break;
                default:
                    ticks.reset(this);
                    if (!this.appControlsActive) this.appControlsActive = true;
            }
        },
        ontick() {
            if (ticks.get(this) > 5) {
                this.appControlsActive = false;
            }
        },
        playEnded() {
            bxplay.playEnded();
        },

        async prepareVideo() {
            loadingApp.show('正在获取视频地址...');
            
            const playurl = new URL('https://api.bilibili.com/x/player/playurl?platform=html5&high_quality=1&qn=112');
            playurl.searchParams.set('cid', this.cid);
            playurl.searchParams.set('bvid', globalThis.video_data.bvid);
            try {
                const pdata = await (webrequestapi.get(playurl.href).then(v => JSON.parse(v)));
                console.log('play data:', pdata);

                loadingApp.hide();
                if (!pdata?.data?.durl?.[0]?.url) {
                    throw '无法获取视频播放地址';
                }

                video.innerHTML = '';
                // document.getElementById('video').replaceWith(document.createElement('video'));
                this.playData = pdata.data;
                const source1 = document.createElement('source');
                source1.src = pdata.data.durl[0].url;
                video.append(source1);
                video.load();

                this.setVideoParamters();
                setTimeout(() => ((video.currentTime = 0), video.play()), 500);

                ticks.add(this);
            } catch (error) {
                return ElMessageBox.confirm('视频地址获取失败! ' + error + ' \n是否重试?', '错误', {
                    cancelButtonText: '取消',
                    confirmButtonText: '重试',
                    type: 'error'
                }).then(() => location.reload()).catch(() => { });
            }

        },



    },

    created() {
        
    },

    mounted() {
        globalThis.instance_ = this;
        ticks.ontick(this.ontick);

        document.body.addEventListener('pointermove', this.onpointermove);
        window.addEventListener('keydown', this.onkeydown);

    },

    unmounted() {
        ticks.cancel_ontick(this.ontick);

        document.body.removeEventListener('pointermove', this.onpointermove);
        window.removeEventListener('keydown', this.onkeydown);

    },

    watch: {
        video_speed() {
            this.setVideoParamters();
        },
        video_volume() {
            this.setVideoParamters();
        },
        'video_information.title'() {
            document.title = this.video_information.title;  
        },

    },

    template: await (await fetch('play.vue.html')).text(),

};


export default data;






