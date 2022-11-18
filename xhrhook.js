export default {
    init: cb => {
        let xhr = window.XMLHttpRequest;

        let _originOpen = xhr.prototype.open;
        xhr.prototype.open = function(method, url, async, user, password) {
            // 记录在里面
            this._eagle_xhr_info = {
                url: url,
                method: method,
                status: null
            };
            return _originOpen.apply(this, arguments); // 执行原有的 open 方法
        };


        let _originSend = xhr.prototype.send;
        xhr.prototype.send = function(value) {
            let _self = this;
            this._eagle_start_time = Date.now(); // 记录发送开始时间

            let ajaxEnd = event => () => {
                if (_self.response) {
                    let responseSize = null;
                    switch (_self.responseType) {
                        case "json":
                            responseSize = JSON && JSON.stringify(_this.response).length;
                            break;
                        case "blob":
                        case "moz-blob":
                            responseSize = _self.response.size;
                            break;
                        case "arraybuffer":
                            responseSize = _self.response.byteLength;
                            break;
                        case "document":
                            responseSize =
                                _self.response.documentElement &&
                                _self.response.documentElement.innerHTML &&
                                _self.response.documentElement.innerHTML.length + 28;
                            break;
                        default:
                            responseSize = _self.response.length;
                    }
                    _self._eagle_xhr_info.event = event;
                    _self._eagle_xhr_info.status = _self.status;
                    _self._eagle_xhr_info.success =
                        (_self.status >= 200 && _self.status <= 206) ||
                        _self.status === 304;
                    _self._eagle_xhr_info.duration = Date.now() - _self._eagle_start_time; // 统计回来的时间
                    _self._eagle_xhr_info.responseSize = responseSize;
                    _self._eagle_xhr_info.requestSize = value ? value.length : 0;
                    _self._eagle_xhr_info.type = "xhr";
                    cb(this._eagle_xhr_info);
                }
            };

            if (this.addEventListener) {
                this.addEventListener("load", ajaxEnd("load"), false);  // 当 load 时执行
                this.addEventListener("error", ajaxEnd("error"), false);
                this.addEventListener("abort", ajaxEnd("abort"), false); // 当 load 时执行
            } else {
                let _origin_onreadystatechange = this.onreadystatechange;
                this.onreadystatechange = function(event) {
                    if (_origin_onreadystatechange) {
                        _originOpen.apply(this, arguments);
                    }
                    if (this.readyState === 4) {
                        ajaxEnd("end")();
                    }
                };
            }
            return _originSend.apply(this, arguments);
        };



        // fetch 兼容
        if (window.fetch) {
            let _origin_fetch = window.fetch;
            window.fetch = function() {
                let startTime = Date.now();
                let args = [].slice.call(arguments);  // 将 arguments 转化为数组

                let fetchInput = args[0];
                let method = "GET";
                let url;

                if (typeof fetchInput === "string") {
                    url = fetchInput;
                } else if (
                    "Request" in window &&
                    fetchInput instanceof window.Request
                ) {
                    url = fetchInput.url;
                    if (fetchInput.method) {
                        method = fetchInput.method;
                    }
                } else {
                    url = "" + fetchInput;
                }

                if (args[1] && args[1].method) {
                    method = args[1].method;
                }

                let fetchData = {
                    method: method,
                    url: url,
                    status: null
                };

                return _origin_fetch.apply(this, args).then(function(response) {
                    fetchData.status = response.status;
                    fetchData.type = "fetch";
                    fetchData.duration = Date.now() - startTime;
                    cb(fetchData);
                    return response;
                });
            };
        }
    }
}
