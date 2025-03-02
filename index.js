// ==UserScript==
// @name         Human Benchmark
// @version      2025-02-23
// @description  Hooks into the DOM to beat the Human Benchmark
// @author       Ash Ketchum
// @match        https://humanbenchmark.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=humanbenchmark.com
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const page_history = { path: "", cleanup: undefined }
    prepLocationChange()
    window.addEventListener('locationchange', navigationListener)
    await navigationListener()
    console.log("LOADED")

    async function navigationListener() {
        const cur_path = location.pathname.split("/")[2]
        if (cur_path == page_history.path) return;
        page_history.path = cur_path
        page_history.cleanup?.();
        switch (cur_path) {
            case "reactiontime":
                page_history.cleanup = await reactiontime()
                break;
            case "number-memory":
                page_history.cleanup = await numbermemory()
                break;
            case "verbal-memory":
                page_history.cleanup = await wordmemory()
                break;
            case "memory":
                page_history.cleanup = await memory()
                break;
            case "typing":
                page_history.cleanup = typing()
                break;
            case "chimp":
                page_history.cleanup = await chimp()
                break;
            case "aim":
                page_history.cleanup = await aim()
                break;
            case "sequence":
                page_history.cleanup = await sequence()
                break;
        }
    }

    async function sequence() {
        const elem = (await exponential_check(() => document.getElementsByClassName("memory-test"), x => x.length))[0]

        let elem_queue = []
        const active = new Set()

        async function listener(mutations) {
            for (let square of mutations) {
                if (square.target.classList.contains("active")) {
                    elem_queue.push(square.target)
                    active.add(square.target)
                } else if (square.target.classList.contains("square")) {
                    active.delete(square.target)
                }
            }

            if (!active.size && elem_queue.length) {
                for (let square of elem_queue) {
                    await wait(50)
                    square.dispatchEvent(new Event('mousedown', { bubbles: true }))
                }
                elem_queue = []
            }

        }

        const observer = new MutationObserver(listener);


        observer.observe(elem, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true,
        })

        return observer.disconnect.bind(observer)
    }


    async function aim() {
        let elem = (await exponential_check(() => document.getElementsByClassName("desktop-only"), x => x.length))[0]

        async function listener() {
            const transform = document.querySelector("div[style*='transform']")
            if (!transform || !transform.childNodes.length) return

            const bbox = transform.childNodes[0].getBoundingClientRect()

            await wait(15)

            transform.dispatchEvent(new MouseEvent("mousedown", {
                bubbles: true,
                clientX: bbox.x,
                clientY: bbox.y,
            }));
        }

        const observer = new MutationObserver(listener);

        observer.observe(elem, {
            subtree: true,
            childList: true
        })

        listener()

        return observer.disconnect.bind(observer)
    }

    async function chimp() {
        let elem = (await exponential_check(() => document.getElementsByClassName("desktop-only"), x => x.length))[0].parentElement

        async function listener() {
            const button = elem.getElementsByTagName("button")?.[0]
            if (button && button.innerText == "Continue") {
                button.click()
                return
            }

            const nodes = [...document.querySelectorAll("[data-cellnumber]")]
            nodes.sort((a, b) => +a.dataset.cellnumber-b.dataset.cellnumber)
            for (let node of nodes) {
                await wait(25)
                node.click()
            }
        }

        const observer = new MutationObserver(listener);

        observer.observe(elem, {
            subtree: true,
            childList: true
        })

        return observer.disconnect.bind(observer)
    }


    function typing() {
        async function listener() {
            const elem = document.getElementsByClassName("letters")?.[0]
            if (!elem) return
            for (let letter of elem.innerText) {
                elem.dispatchEvent(new KeyboardEvent('keydown', { key: letter, bubbles: true }))
            }
            console.log(elem.innerText)
        }

        const observer = new MutationObserver(listener);

        observer.observe(document.body, {
            subtree: true,
            childList: true
        })

        return observer.disconnect.bind(observer)
    }

    async function memory() {
        const elem = (await exponential_check(() => document.getElementsByClassName("memory-test"), x => x.length))[0]

        let to_click = new Set()

        async function listener(mutations) {
            if (to_click.size == 0) {
                for (let node of mutations) to_click.add(node.target)
            }
            if (mutations[0].oldValue.split(" ").includes("active")) {
                await wait(500)
                for (let node of to_click) node.dispatchEvent(new Event('mousedown', { bubbles: true }))
                to_click = new Set()
            }
        }


        const observer = new MutationObserver(listener);

        observer.observe(elem, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true,
        })

        return observer.disconnect.bind(observer)
    }

    async function reactiontime() {
        let parent = (await exponential_check(() => document.getElementsByClassName("view-splash"), x => x.length))[0].parentElement

        async function listener() {
            const elem = parent.children[0]
            if (elem.classList.contains("view-result")) {
                console.log(elem.innerText)
                await wait(500)
                elem.dispatchEvent(new Event('mousedown', { bubbles: true }))
            } else if (["view-go", "view-splash"].some(x => elem.classList.contains(x))) {
                elem.dispatchEvent(new Event('mousedown', { bubbles: true }))
            }
        }

        const observer = new MutationObserver(listener);

        observer.observe(parent, {
            subtree: true,
            childList: true
        })

        return observer.disconnect.bind(observer)
    }

    async function wordmemory() {
        let elem = (await exponential_check(() => document.getElementsByClassName("verbal-memory-test"), x => x.length))[0]
        let memory = new Set()

        async function listener() {
            await wait(50)
            if (['gameover', 'ready'].some(x => elem.classList.contains(x))) {
                memory = new Set()
                return
            }
            const word = (await exponential_check(() => document.getElementsByClassName("word"), x => x.length))[0].innerText
            if (memory.has(word)) {
                xpath_get_node("//button[text()='SEEN']", elem)?.click()
            } else {
                memory.add(word)
                xpath_get_node("//button[text()='NEW']", elem)?.click()
            }
        }

        const observer = new MutationObserver(listener);

        observer.observe(elem, {
            subtree: true,
            childList: true,
            characterData: true
        })

        return observer.disconnect.bind(observer)
    }

    async function numbermemory() {
        const elem = (await exponential_check(() => document.getElementsByClassName("number-memory-test"), x => x.length))[0]
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        let lastnum = undefined

        async function listener() {
            if (!isNaN(elem.innerText)) {
                lastnum = elem.innerText
            }
            if (elem.innerText.includes("Submit")) {
                const textbox = elem.getElementsByTagName("input")[0]
                nativeInputValueSetter.call(textbox, lastnum);
                textbox.dispatchEvent(new Event('input', { bubbles: true }));
                await wait(500)
                elem.getElementsByTagName("button")[0].click()
            }
            if (elem.innerText.includes("NEXT")) {
                console.log(elem.innerText)
                elem.getElementsByTagName("button")[0].click()
            }
        }

        const observer = new MutationObserver(listener);

        observer.observe(elem, {
            subtree: true,
            childList: true
        })

        return observer.disconnect.bind(observer)
    }

    function wait(time, callback) {
        return new Promise(resolve => setTimeout(() => resolve(callback?.()), time))
    }

    async function exponential_check(get_func, check_func) {
        let res = get_func()
        for (let iter = 1; !check_func(res); iter++) res = await wait(5 ** iter, get_func)
        return res
    }

    function xpath_get_node(selector, elem) {
        return document
            .evaluate(selector, elem, null, XPathResult.ANY_UNORDERED_NODE_TYPE)
            ?.singleNodeValue
    }

    function prepLocationChange() {
        let oldPushState = history.pushState;
        history.pushState = function pushState() {
            let ret = oldPushState.apply(this, arguments);
            window.dispatchEvent(new Event('pushstate'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        };

        let oldReplaceState = history.replaceState;
        history.replaceState = function replaceState() {
            let ret = oldReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('replacestate'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        };

        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('locationchange'));
        });
    }
})();