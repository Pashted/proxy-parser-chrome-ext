import '@babel/polyfill'
import "../less/template.less";
import appendToLog from './logger'

let selector, nextPage, filter, schema, currentLink, existsData = '', resultArea,


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
            appendToLog('Params saved');

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

            let userParams = await getParams(),

                result = await new Promise(resolve => {
                    chrome.runtime.onMessage.addListener(function listener(result) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(result);
                    });

                    chrome.tabs.executeScript(
                        { code: `var userParams = ${JSON.stringify(userParams)};` },
                        () => chrome.tabs.executeScript({ file: './scripts/main.js' })
                    );
                });

            return result;


        } catch (e) {
            console.log(e);
        }
    },


    convertData = data => {

        let _schema = schema.val().split(',').map(el => el.trim()),

            typeValue = { HTTP: 'h', HTTPS: 's' },
            anonValue = { Anonymous: 2, HighAnonymous: 4 },
            result = [];

        $(data).find('tr:not(:empty)').each((i, tr) => {

            let $td = $(tr).find('td'),

                addr = _schema.reduce((res, name, n) => {
                    if (!name)
                        return res;

                    switch (name) {

                        case 'port':
                            res[name] = parseInt($td.eq(n).text().trim());
                            break;

                        case 'type':
                            res[name] = typeValue[$td.eq(n).text()];
                            break;

                        case 'anon':
                            res[name] = anonValue[$td.eq(n).text().replace(/\s/, '')];
                            break;

                        case 'country':
                            res[name] = $td.eq(n).find('img').attr('src')
                                .replace(/^.*\/([a-z]+?)\.[^.]+$/i, '$1')
                                .toUpperCase();
                            break;

                        case 'status':
                            res[name] = 'new';
                            break;

                        case 'source':
                            res[name] = nextPage.val().replace(/^.*?\/{2}([^/]+).*$/, '$1');
                            break;

                        default:
                            res[name] = $td.eq(n).text().trim();
                    }

                    return res;

                }, {});


            result.push(addr);

        });


        return JSON.stringify(result);
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


    $('.start')
        .on({
            click: async function () {
                await setParams();

                if (!validForm())
                    return false;

                let { res } = await Process();

                resultArea.val((existsData + convertData(res)).replace('][', ','));
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


});