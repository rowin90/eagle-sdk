(function () {
    'use strict';

    var Util = {
        onload:(cb)=>{
            if(document.readyState === 'interactive'){
                cb();
                return void 0
            }

            window.addEventListener('load',()=>{
                cb();
            });
        },
        filterTime:(a,b) => Math.abs(a-b)
    };

    const { filterTime: filterTime$1 } = Util;

    // 封装一下 PerformanceObserver，方便后续调用
    const getObserver = (type, cb) => {
        const perfObserver = new PerformanceObserver((entryList) => {
            cb(entryList.getEntries());
        });
        perfObserver.observe({ type, buffered: true });
    };

    var perf = {
        init:cb => {
            cb();

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
                        pervPage: filterTime$1(timing.fetchStart, timing.navigationStart), // 上一个页面
                        redirect: filterTime$1(timing.responseEnd, timing.redirectStart), // 页面重定向时间
                        dns: filterTime$1(timing.domainLookupEnd, timing.domainLookupStart), // DNS查找时间
                        connect: filterTime$1(timing.connectEnd, timing.connectStart), // TCP建连时间
                        network: filterTime$1(timing.connectEnd, timing.navigationStart), // 网络总耗时

                        // 网络接收
                        send: filterTime$1(timing.responseStart, timing.requestStart), // 前端从发送到接收到后端第一个返回
                        receive: filterTime$1(timing.responseEnd, timing.responseStart), // 接受页面时间
                        request: filterTime$1(timing.responseEnd, timing.requestStart), // 请求页面总时间

                        // 前端渲染
                        dom: filterTime$1(timing.domComplete, timing.domLoading), // dom解析时间
                        loadEvent: filterTime$1(timing.loadEventEnd, timing.loadEventStart), // loadEvent时间
                        frontend: filterTime$1(timing.loadEventEnd, timing.domLoading), // 前端总时间

                        // 关键阶段
                        load: filterTime$1(timing.loadEventEnd, timing.navigationStart), // 页面完全加载总时间
                        domReady: filterTime$1(
                            timing.domContentLoadedEventStart,
                            timing.navigationStart
                        ), // domready时间
                        interactive: filterTime$1(
                            timing.domInteractive,
                            timing.navigationStart
                        ), // 可操作时间
                        ttfb: filterTime$1(timing.responseStart, timing.navigationStart) // 首字节时间
                    };
                },

                getPaintTime() {
                    const data  = {};
                    getObserver('paint', entries => {
                        entries.forEach(entry => {
                            console.log("-> entry", entry);
                            data[entry.name] = entry.startTime;
                            // if (entry.name === 'first-contentful-paint') {
                            //     getLongTask(entry.startTime)
                            // }
                        });

                    });
                    return data
                }


            };

            let performance = window.performance;

            Util.domReady(()=>{
                let perData = Util.getPerData(performance.timing);

                let paintTime = Util.getPaintTime();
                console.log("-> paintTime", paintTime);
                console.log("-> perData", perData);
            });

        }
    };

    const { filterTime } = Util;

    let resolvePerformanceTiming = timing => {
        return {
            initiatorType: timing.initiatorType,
            name: timing.name,
            duration: parseInt(timing.duration),
            redirect: filterTime(timing.redirectEnd, timing.redirectStart), // 重定向
            dns: filterTime(timing.domainLookupEnd, timing.domainLookupStart), // DNS解析
            connect: filterTime(timing.connectEnd, timing.connectStart), // TCP建连
            network: filterTime(timing.connectEnd, timing.startTime), // 网络总耗时

            send: filterTime(timing.responseStart, timing.requestStart), // 发送开始到接受第一个返回
            receive: filterTime(timing.responseEnd, timing.responseStart), // 接收总时间
            request: filterTime(timing.responseEnd, timing.requestStart), // 总时间

            ttfb: filterTime(timing.responseStart, timing.requestStart) // 首字节时间
        };
    };

    const resolveEntries = entries => entries.map(_ => resolvePerformanceTiming(_));

    var resource = {
        init:(cb)=>{

            let performance =
                window.performance ||
                window.mozPerformance ||
                window.msPerformance ||
                window.webkitPerformance;


            Util.onload(()=>{

                // if(window.PerformanceObserver){
                //     let observer = new window.PerformanceObserver(list => {
                //         try {
                //             let entries = list.getEntries();
                //             cb(resolveEntries(entries));
                //         } catch (e) {
                //             console.error(e);
                //         }
                //     });
                //     observer.observe({
                //         type: "resource"
                //     });
                // }else{
                    let entries = performance.getEntriesByType("resource");
                    let entriesData = resolveEntries(entries);
                    cb(entriesData);
                // }

            });
        }
    };

    let formatError = errObj => {
        let col = errObj.column || errObj.columnNumber; // Safari Firefox
        let row = errObj.line || errObj.lineNumber; // Safari Firefox
        let message = errObj.message;
        let name = errObj.name;

        let { stack } = errObj;
        if (stack) {
            let matchUrl = stack.match(/https?:\/\/[^\n]+/);
            let urlFirstStack = matchUrl ? matchUrl[0] : "";
            let regUrlCheck = /https?:\/\/(\S)*\.js/;

            let resourceUrl = "";
            if (regUrlCheck.test(urlFirstStack)) {
                resourceUrl = urlFirstStack.match(regUrlCheck)[0];
            }

            let stackCol = null;
            let stackRow = null;
            let posStack = urlFirstStack.match(/:(\d+):(\d+)/);
            if (posStack && posStack.length >= 3) {
                [, stackCol, stackRow] = posStack;
            }

            // TODO formatStack
            return {
                content: stack,
                col: Number(col || stackCol),
                row: Number(row || stackRow),
                message,
                name,
                resourceUrl
            };
        }

        return {
            row,
            col,
            message,
            name
        };
    };


    var errorResponse = {
        init:(cb) => {
            let _origin_error = window.error;
            window.onerror = function(message, source, lineno, colno, error){
                console.log("-> error", error);
                let errorInfo = formatError(error);

                errorInfo._message = message;
                errorInfo._source = source;
                errorInfo._lineno = lineno;
                errorInfo._colno = colno;

                cb(errorInfo);

                errorInfo.type = 'error';
                _origin_error && _origin_error.apply(window,arguments);
            };
        }
    };

    perf.init(perfData => {
        console.log("-> perfData", perfData);
    });

    resource.init((resourceData)=>{
        console.log("-> resourceData", resourceData);
    });

    errorResponse.init(error => {
        console.log("-> error", error);
    });

})();
