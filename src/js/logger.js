let log = $('.log'),

    appendToLog = text => {
        if (text instanceof Array) {
            text.forEach(txt => appendToLog(txt));
            return;
        }

        let message = $(`<div>${text}</div>`)
            .appendTo(log);

        setTimeout(
            () => message.fadeOut(() => message.remove()),
            2000
        );
    };

export default appendToLog;