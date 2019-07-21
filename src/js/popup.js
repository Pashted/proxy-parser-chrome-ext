import '@babel/polyfill'
import "../less/template.less";
import appendToLog from './logger'

let selector, nextPage, filter, schema, currentLink, existsData = '', resultArea,

    typeValue = { HTTP: 'h', HTTPS: 's' },
    anonValue = { Anonymous: 2, HighAnonymous: 4 },

    getParams = () => new Promise(resolve => {
        chrome.storage.local.get([ 'userParams' ], ({ userParams }) => {
            resolve(userParams || {});
        });
    }),

    setParams = () => new Promise(resolve => {
        let userParams = {
            selector: selector.val() || null,
            next:     nextPage.val() || null,
            garbage:  filter.val() || null,
            schema:   schema.val() || null,
        };

        chrome.storage.local.set({ userParams }, () => {
            // appendToLog('Params saved');

            resolve(userParams);
        });
    }),


    setCurrentLink = n => currentLink.prop('href', nextPage.val() + n),


    validForm = () => {
        let errors = [];

        if (!selector.val())
            errors.push("Selector is empty");

        if (!schema.val())
            errors.push("Schema is empty");

        if (errors.length) {
            appendToLog(errors);
            return false;
        }

        return true;
    },


    Process = async () => {

        try {

            let userParams = await getParams();

            chrome.tabs.executeScript(
                { code: `var userParams = ${JSON.stringify(userParams)};` },
                () => chrome.tabs.executeScript({ file: './scripts/main.js' })
            );

            return new Promise(resolve => {
                chrome.runtime.onMessage.addListener(function listener(result) {
                    chrome.runtime.onMessage.removeListener(listener);
                    resolve(result);
                });
            });

        } catch (e) {
            console.log(e);
        }
    },

    getSchema = () => schema.val().split(',').map(el => el.trim()),

    reducerObj = td => (result, name, n) => {
        if (!name)
            return result;

        switch (name) {

            case 'port':
                result[name] = parseInt(td.eq(n).text().trim());
                break;

            case 'type':
                result[name] = typeValue[td.eq(n).text()] || 0;
                break;

            case 'anon':
                result[name] = anonValue[td.eq(n).text().replace(/\s/, '')] || 0;
                break;

            case 'country':
                result[name] = td.eq(n).find('img').attr('src')
                    .replace(/^.*\/([a-z]+?)\.[^.]+$/i, '$1')
                    .toUpperCase();
                break;

            case 'source':
                result[name] = nextPage.val().replace(/^.*?\/{2}([^/]+).*$/, '$1');
                break;

            default:
                result[name] = td.eq(n).text().trim();
        }

        return result;
    },

    convertData = data => {

        let _schema = getSchema(),
            result = [];

        $(data).find('tr:not(:empty)').each((i, tr) => {

            let addr = _schema.reduce(
                reducerObj($(tr).find('td')),
                {}
            );

            result.push(Object.values(addr).join(","));

        });

        result = result.join("\n") + "\n";

        return result;
    },


    reducer = line => (result, name, n) => {
        if (!name)
            return result;

        let str = line[n] || '';

        switch (name) {

            case 'port':
                result.push(parseInt(str.trim()));
                break;

            case 'type':
                result.push(typeValue[str] || 0);
                break;

            case 'anon':
                result.push(anonValue[str.replace(/\s/, '')] || 0);
                break;

            case 'country':
                result.push(str.toUpperCase() || 0);
                break;

            case 'source':
                result.push(nextPage.val().replace(/^.*?\/{2}(?:www\.)?([^/]+).*$/, '$1'));
                break;

            default:
                result.push(str.trim());
        }

        return result;

    },

    convertCustomData = data => {

        let _schema = getSchema(),
            result = [];

        data.trim().split("\n").forEach(line => {

            let addr = _schema.reduce(
                reducer(line.replace(':', ',').split(',')),
                []
            );

            result.push(addr.join(","));

        });

        result = result.join("\n") + "\n";

        return result;
    };


getParams().then(async params => {

    currentLink = $('.current-link');

    selector = $('.selector').blur(setParams);
    if (params.selector)
        selector.val(params.selector);


    nextPage = $('.next-page-template').blur(setParams);
    if (params.next)
        nextPage.val(params.next);


    filter = $('.clean-selector').blur(setParams);
    if (params.garbage)
        filter.val(params.garbage);


    schema = $('.schema').blur(setParams);
    if (params.schema)
        schema.val(params.schema);


    resultArea = $('.result');

    resultArea.on({
        focus() {
            resultArea[0].select();
        },
        dblclick() {
            navigator.clipboard.writeText(resultArea.val().trim());
            appendToLog('Result copied to clipboard');
        }
    });


    $('.start')
        .on({
            click: async function () {
                await setParams();

                if (!validForm())
                    return false;

                let { res } = await Process();

                resultArea.val(existsData + convertData(res));
            }
        });


    let counter = 1;
    setCurrentLink(counter);

    $('.next').on({
        click: async function () {

            counter++;
            setCurrentLink(counter);

            existsData = resultArea.val();

            appendToLog(nextPage.val() + counter);


            chrome.tabs.executeScript(
                { code: `location.href = "${nextPage.val() + counter}";` }
            );
        }
    });

    $('.convert').on({
        click() {
            console.log();
            resultArea.val(convertCustomData(resultArea.val()));
        }
    })


});