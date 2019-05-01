let puppeteer = require('puppeteer');
let request = require('request');
let fs = require('fs');
let opencc = require('node-opencc');
const WAITING = 50;
const beginUrl = 'https://jp.sonic-learning.com/2010/02/04/%E5%96%AE%E5%85%831-%E5%85%AD%E7%A8%AE%E5%93%81%E8%A9%9E/';
const EXPORT_MD_DIR = 'sonic.md';

(async () => {
    let browser, page;
    browser = await puppeteer.launch({
        headless: true, 
        timeout: 0
    });
    page = await browser.newPage();
    await page.setViewport({height: 0, width: 0});

    let sonicUrl = beginUrl;
    let list = [];
    let stop = true;
    while (stop) {
    // for (let i of [1, 2, 3]) {
        let listObj = {};
        await page.goto(sonicUrl);
        await page.waitFor(WAITING);

        await page.waitFor('div.browse a');
        let title = await page.$eval('a[rel="bookmark"]', n => n.innerText);
        listObj.title = title;
        let browse = await page.$('div.browse');
        let links = await browse.$$('a');
        let nextExisted = false;
        for (link of links) {
            let rel = await(await link.getProperty('rel')).jsonValue();
            if (rel === 'next') {
                nextExisted = true;
                let href = await(await link.getProperty('href')).jsonValue();
                listObj.url = sonicUrl;
                sonicUrl = href;
                console.log(listObj);
                list.push(listObj)
            }
        }
        stop = nextExisted;
    }
    let markdownText = '';
    for (element of list) {
        markdownText += `[${element.title}](${element.url})\n\n`;
    }
    fs.writeFile(EXPORT_MD_DIR, markdownText, (err) => {
        if (err) {
            console.error(err);
            return;
        };
    });
    browser.close();
})();