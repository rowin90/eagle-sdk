import Util from "./util.js";
const { filterTime } = Util

// 封装一下 PerformanceObserver，方便后续调用
export const getObserver = (type, cb) => {
    const perfObserver = new PerformanceObserver((entryList) => {
        cb(entryList.getEntries())
    })
    perfObserver.observe({ type, buffered: true })
}

export default {
    init:cb => {
        cb()

        let isDOMReady = false;
        let isOnload = false;


        let Util = {
            // DOM解析完成
            domReady(callback) {
                if (isDOMReady === true) {
                    return void 0;
                }
                let timer = null;
                let runCheck = () => {
                    if (performance.timing.domComplete) {
                        // 停止循环检测
                        clearTimeout(timer);
                        // 运行 callback
                        callback();
                        isDOMReady = true;
                    } else {
                        // 再去循环检测
                        timer = setTimeout(runCheck, 0);
                    }
                };
                if (document.readyState === "interactive") {
                    callback();
                    return void 0;
                }
                document.addEventListener("DOMContentLoaded", () => {
                    // 开始循环检测 是否DOMContentLoaded已经完成
                    runCheck();
                });
            },

            // 页面加载完成
            onload(callback) {
                if (isOnload === true) {
                    return void 0;
                }
                let timer = null;
                let runCheck = () => {
                    if (performance.timing.loadEventEnd) {
                        // 停止循环检测
                        clearTimeout(timer);
                        // 运行 callback
                        callback();
                        isOnload = true;
                    } else {
                        // 再去循环检测
                        timer = setTimeout(runCheck, cycleTime);
                    }
                };
                if (document.readyState === "interactive") {
                    callback();
                    return void 0;
                }
                window.addEventListener("load", () => {
                    // 开始循环检测 是否DOMContentLoaded已经完成
                    runCheck();
                });
            },
            getPerData(timing) {
                return {
                    // 网络建连
                    pervPage: filterTime(timing.fetchStart, timing.navigationStart), // 上一个页面
                    redirect: filterTime(timing.responseEnd, timing.redirectStart), // 页面重定向时间
                    dns: filterTime(timing.domainLookupEnd, timing.domainLookupStart), // DNS查找时间
                    connect: filterTime(timing.connectEnd, timing.connectStart), // TCP建连时间
                    network: filterTime(timing.connectEnd, timing.navigationStart), // 网络总耗时

                    // 网络接收
                    send: filterTime(timing.responseStart, timing.requestStart), // 前端从发送到接收到后端第一个返回
                    receive: filterTime(timing.responseEnd, timing.responseStart), // 接受页面时间
                    request: filterTime(timing.responseEnd, timing.requestStart), // 请求页面总时间

                    // 前端渲染
                    dom: filterTime(timing.domComplete, timing.domLoading), // dom解析时间
                    loadEvent: filterTime(timing.loadEventEnd, timing.loadEventStart), // loadEvent时间
                    frontend: filterTime(timing.loadEventEnd, timing.domLoading), // 前端总时间

                    // 关键阶段
                    load: filterTime(timing.loadEventEnd, timing.navigationStart), // 页面完全加载总时间
                    domReady: filterTime(
                        timing.domContentLoadedEventStart,
                        timing.navigationStart
                    ), // domready时间
                    interactive: filterTime(
                        timing.domInteractive,
                        timing.navigationStart
                    ), // 可操作时间
                    ttfb: filterTime(timing.responseStart, timing.navigationStart) // 首字节时间
                };
            },

            getPaintTime() {
                const data  = {}
                getObserver('paint', entries => {
                    entries.forEach(entry => {
                        console.log("-> entry", entry);
                        data[entry.name] = entry.startTime
                        // if (entry.name === 'first-contentful-paint') {
                        //     getLongTask(entry.startTime)
                        // }
                    })

                })
                return data
            }


        }

        let performance = window.performance;

        Util.domReady(()=>{
            let perData = Util.getPerData(performance.timing)

            let paintTime = Util.getPaintTime()
            console.log("-> paintTime", paintTime);
            console.log("-> perData", perData);
        })

    }
}
