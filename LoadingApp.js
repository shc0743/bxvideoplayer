/*
LoadingApp.js   v1.3
    LoadingApp for Web (Genshin Impact style)

License: [MIT License](https://mit-license.org)
Author: [shc0743](https://github.com/shc0743/)


*/



// to avoid external resource usage
function addCSS(css, el = null, adopt = false) {
    if ((el === null || adopt) && ('adoptedStyleSheets' in document)) {
        const style = new CSSStyleSheet;
        style.replace(css);
        (el || document).adoptedStyleSheets.push(style);
        return style;
    } else {
        let EL = document.createElement('style');
        EL.innerHTML = css;
        (el || document.head || document.documentElement).append(EL);
        return EL;
    }
}


export class LoadingApp {
    // some devices doesn't support this
    // _el;
    // _sr;
    // _lt;

    constructor(MountElement = null) {
        this._ShownCounter = 0;

        if (!MountElement || !MountElement instanceof HTMLElement) MountElement = document.body || document.documentElement;
        this._el = document.createElement('div');
        this._sr = this._el.attachShadow({ mode: 'open' });
        this._sr.innerHTML = `
        <div id="LoadingApp" class="LoadingApp">
            <div class="LoadingApp_Content">
                <div class="LoadingApp_Spinner">
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_0" data-pos="0"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_1" data-pos="1"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_2" data-pos="2"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_3" data-pos="3"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_4" data-pos="4"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_5" data-pos="5"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_6" data-pos="6"></span>
                    <span class="LoadingApp_SpinContext_Item LoadingApp_Num_7" data-pos="7"></span>
                </div>
                <div class="LoadingApp_Text"></div>
            </div>
        </div>
        `;
        this._lt = this._sr.querySelector('.LoadingApp_Text');
        addCSS(LoadingApp_CSSContent, this._sr, true);
        this.hide();
        this.mount(MountElement);
        setInterval(this._TimerProc, 100, this);
    }

    mount(ElementOrSelector) {
        if (typeof ElementOrSelector === 'string') {
            ElementOrSelector = document.querySelector(ElementOrSelector);
            if (!ElementOrSelector) throw new Error('RuntimeException: Cannot find element with specified selector');
        }
        else if (!ElementOrSelector || (!ElementOrSelector instanceof HTMLElement)) throw new TypeError('Invalid Paramter');
        ElementOrSelector.append(this._el);
    }


    // internal functions
    _TimerProc(that) {
        if (that._el.hidden) return;

        const MyElements = that._sr.querySelectorAll('.LoadingApp .LoadingApp_SpinContext_Item');
        const cnt = MyElements.length;
        for (const i of MyElements) {
            // assert(cnt > 0)
            i.dataset.pos = (+i.dataset.pos + 1) % cnt;
        }

    }

    
    // basic functions - control the loading manually
    // If you want to use advanced functions, these are not recommended.
    hide() {
        this._el.hidden = true;
    }
    show(withText = '') {
        this._el.hidden = false;
        if (typeof withText === 'string') this.setText(withText);
    }
    setText(text = '') {
        this._lt.innerText = text;
    }


    // advanced functions - enhanced by adding Promise&Event supports
    // you can also execute them for many times. they will be managed
    // to make sure the loading hides after all tasks are done.
    // _ShownCounter = 0;
    IncreaseShownCounter() {
        if (this._ShownCounter++ < 1) {
            this.show(null);
        }
        return this._ShownCounter;
    }
    DecreaseShownCounter() {
        if (--this._ShownCounter < 1) {
            this.hide();
        }
        return this._ShownCounter;
    }
    addText(text = '') {
        const el = document.createElement('div');
        el.append(document.createTextNode(text));
        this._lt.append(el);
        return el;
    }

    _AdvFuncRetValueWrapper(ret, modifiers = {}) {
        return Object.assign(ret, modifiers);
    }
    showDuring(duration = 5000, withText = '') {
        this.IncreaseShownCounter();
        const textNode = withText ? this.addText(withText) : null;
        const timer_id = setTimeout(() => ((this.DecreaseShownCounter()), (textNode && textNode.remove())), duration);
        return this._AdvFuncRetValueWrapper(() => ((clearTimeout(timer_id)), (textNode && textNode.remove())),
            { textNode });
    }
    wait(duration = 5000, withText = '') {
        return this.showDuring(duration, withText);
    }
    waitEvent(evtObject, evtName, evtProps = {}, withText = '') {
        const textNode = withText ? this.addText(withText) : null;
        const listener = () => ((this.DecreaseShownCounter()), (textNode && textNode.remove()));
        const rropt = Object.assign({ once: true }, evtProps);
        this.IncreaseShownCounter();
        evtObject.addEventListener(evtName, listener, rropt);
        return this._AdvFuncRetValueWrapper(() => ((evtObject.removeEventListener(evtName, listener, rropt)), (textNode && textNode.remove())),
            { textNode });
    }
    waitUntil(toWait) {
        if (toWait instanceof Promise) {
            this.IncreaseShownCounter();
            const textNode = arguments[1] ? this.addText(arguments[1]) : null;
            toWait.finally(() => ((this.DecreaseShownCounter()), (textNode && textNode.remove())));
            return this._AdvFuncRetValueWrapper({ success: true }, { textNode });
        }
        if (toWait instanceof EventTarget) {
            return this.waitEvent.apply(this, arguments);
        }
        if (typeof toWait === 'function') {
            const textNode = arguments[1] ? this.addText(arguments[1]) : null;
            const ret = { textNode };
            const func_Result = toWait.call(this, ret);
            if (func_Result instanceof Promise) {
                const fr = this.waitUntil(func_Result);
                func_Result.finally(() => (textNode && textNode.remove()));
                return fr;
            }
            return this._AdvFuncRetValueWrapper(ret);
        }
        return false;
    }
};


export const LoadingApp_CSSContent = `
.LoadingApp {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background: var(--loadingapp-background);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    user-select: none;

    --loadingapp-background: rgba(0, 0, 0, 0.5);
    --loadingapp-spinner-size: 80px;
    --loadingapp-spinner-context-size: 14px;
    --loadingapp-spinner-color: #ffee7b;
    --loadingapp-spinner-xolor: #ffff00;
}
.LoadingApp .LoadingApp_Content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.LoadingApp .LoadingApp_Spinner {
    flex: 1;
    display: block;
    position: relative;
    width: var(--loadingapp-spinner-size);
    height: var(--loadingapp-spinner-size);
    min-height: var(--loadingapp-spinner-size);
}
.LoadingApp .LoadingApp_SpinContext_Item {
    display: block;
    position: absolute;
    width: var(--loadingapp-spinner-context-size);
    height: var(--loadingapp-spinner-context-size);
    background-color: var(--loadingapp-spinner-color);
    border-radius: 50%;
    box-shadow: 0 0 15px 0 var(--loadingapp-spinner-xolor);
    transform: translate(-50%, -50%);
}
.LoadingApp .LoadingApp_Text {
    color: white;
    text-align: center;
}
.LoadingApp .LoadingApp_Text:not(:empty) {
    margin-top: 1.5em;
}

.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_0 { opacity: 1; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_1 { opacity: 0.9; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_2 { opacity: 0.7; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_3 { opacity: 0.5; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_4 { opacity: 0.3; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_5 { opacity: 0.5; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_6 { opacity: 0.7; }
.LoadingApp .LoadingApp_SpinContext_Item.LoadingApp_Num_7 { opacity: 0.9; }


.LoadingApp .LoadingApp_SpinContext_Item[data-pos="0"] {
    left: calc(var(--loadingapp-spinner-size) / 2);
    top: 0;
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="2"] {
    left: calc(var(--loadingapp-spinner-size));
    top: calc(var(--loadingapp-spinner-size) / 2);
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="4"] {
    left: calc(var(--loadingapp-spinner-size) / 2);
    top: calc(var(--loadingapp-spinner-size));
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="6"] {
    left: 0;
    top: calc(var(--loadingapp-spinner-size) / 2);
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="1"] {
    left: calc((var(--loadingapp-spinner-size) / 4) * 3);
    top: calc(var(--loadingapp-spinner-size) / 4);
    transform: translate(0%, -100%);
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="3"] {
    left: calc((var(--loadingapp-spinner-size) / 4) * 3);
    top: calc((var(--loadingapp-spinner-size) / 4) * 3);
    transform: translate(0%, 0%);
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="5"] {
    left: calc(var(--loadingapp-spinner-size) / 4);
    top: calc((var(--loadingapp-spinner-size) / 4) * 3);
    transform: translate(-100%, 0%);
}
.LoadingApp .LoadingApp_SpinContext_Item[data-pos="7"] {
    left: calc(var(--loadingapp-spinner-size) / 4);
    top: calc(var(--loadingapp-spinner-size) / 4);
    transform: translate(-100%, -100%);
}
`;


