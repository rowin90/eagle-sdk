
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


export default {
    init:(cb) => {
        let _origin_error = window.error
        window.onerror = function(message, source, lineno, colno, error){
            console.log("-> error", error);
            let errorInfo = formatError(error)

            errorInfo._message = message
            errorInfo._source = source
            errorInfo._lineno = lineno
            errorInfo._colno = colno

            cb(errorInfo)

            errorInfo.type = 'error'
            _origin_error && _origin_error.apply(window,arguments)
        }
    }
}
