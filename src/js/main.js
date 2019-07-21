let update = () => {
    let { selector, garbage } = userParams,
        obj = $(selector);

    if (garbage)
        obj.find(garbage).remove();

    return obj.html();
};

chrome.runtime.sendMessage({ res: update() });