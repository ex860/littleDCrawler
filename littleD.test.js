let puppeteer = require('puppeteer');
let request = require('request');
let fs = require('fs');
let opencc = require('node-opencc');
const WAITING = 50;

jest.setTimeout(300000);

let search = false;
const LITTLED_URL = 'https://dict.hjenglish.com/jp/';
const AUTHOR_LIST = ['skent', 'akitomo', 'kaoring', 'kyokotokyojapan', 'kiiro', 'yasuo', 'sorechaude', 'Phlebia'];
const PRIOR_AUTHOR = 'strawberrybrown';
const DOWNLOAD_DIR = 'C:/Users/Yu-Hsien/AppData/Roaming/Anki2/YuHsien/collection.media/';
const EXPORT_JSON_DIR = 'D:/Ankieasy/littleDJSON.json';
const wordList = [
'移動',
];

String.prototype.replaceAll = function(s1, s2) {
    let result = this;
    for (token of s1) {
        result = result.replace(new RegExp(token, "gm"), s2);
    }
    return result;
}

const sentenceParsing = (wordArray, AnkiCard) => {
    wordArray.map(readWord => {
        readWord.map(POS => {
            AnkiCard.front_word += `(${opencc.simplifiedToTaiwan(POS.partOfSpeech.replaceAll(['\n', ' '], ''))})<br>`;
            AnkiCard.back_word += `(${opencc.simplifiedToTaiwan(POS.partOfSpeech.replaceAll(['\n', ' '], ''))})<br>`; 
            POS.explain.map((exp, expIdx) => {
                AnkiCard.front_word += `${Number(expIdx + 1)}. ${exp.sentence.JP.replaceAll(['\n', ' '], '')}<br>`;
                AnkiCard.back_word += `${Number(expIdx + 1)}. ${opencc.simplifiedToTaiwan(exp.meaning.replaceAll(['\n', ' '], ''))}<br>`;
                AnkiCard.back_word += `${opencc.simplifiedToTaiwan(exp.sentence.CH.replaceAll(['\n', ' '], ''))}<br>`;
            });
        });
    });
    return AnkiCard;
};

const littleDCrawler = async (page, word) => {
    console.log(`<<< ${word} >>>`);
    await page.goto(LITTLED_URL);
    await page.waitFor(WAITING);

    await page.waitFor('input[name="word"]');
    await page.type('input[name="word"]', word);
    await page.waitFor(1000);

    await page.waitFor('button[data-trans="jc"]');
    await page.click('button[data-trans="jc"]');
    try {
        await page.waitFor('section.detail-groups');
        let detailGroups = await page.$$('section.detail-groups');
        let wordArray = [];
        for (detailGroup of detailGroups) {
            POSs = await detailGroup.$$('dl');
            let POSArray = []
            for (POS of POSs) {
                let wordObj = {};
                wordObj.partOfSpeech = await POS.$eval('dt', n => n.innerText);
                wordObj.explain = [];
                let explains = await POS.$$('dd');
                for (explain of explains) {
                    let expObj = {};
                    expObj.meaning = await explain.$eval('h3 p:nth-child(2)', n => n.innerText);
                    expObj.sentence = {
                        JP: '',
                        CH: '',
                    };
                    if (Boolean(await explain.$('ul li'))) {
                        let sentLi = await explain.$('ul li');
                        expObj.sentence.JP = await sentLi.$eval('p.def-sentence-from', n => n.innerText);
                        expObj.sentence.CH = await sentLi.$eval('p.def-sentence-to', n => n.innerText);
                    }
                    wordObj.explain.push(expObj);
                }
                POSArray.push(wordObj);
            }
            wordArray.push(POSArray);
        }
        return wordArray;
    } catch (err) {
        console.log(err);
        return [];
    }
    
}

const ForvoCrawler = async (page, word) => {
    await page.goto(`https://forvo.com/word/${word}/#ja`);
    await page.waitFor(WAITING);
    
    try {
        let audioArray = [];
        await page.waitFor('article.pronunciations header em#ja');
        let pronunciations = await page.$$('article.pronunciations');
        for (pronunciation of pronunciations) {
            let em = await pronunciation.$('header em');
            if (await (await em.getProperty('id')).jsonValue() === 'ja') {
                let pronLis = await pronunciation.$$('ul.show-all-pronunciations li');
                for (pronLi of pronLis) {
                    let audioObj = {};
                    if (Boolean(await pronLi.$('span.play')) && Boolean(await pronLi.$('span.ofLink'))) {
                        audioObj.audioUrl = await pronLi.$eval('span.play', element => {
                            const playStr = element.getAttribute('onClick');
                            const playParams = playStr.split(';')[0].split(')')[0].split('(')[1].split(',');
                            const paramFirst = atob(playParams[1].substring(1, playParams[1].length-1));
                            const paramFourth = atob(playParams[4].substring(1, playParams[4].length-1));
                            if (paramFourth) {
                                return `https://audio00.forvo.com/audios/mp3/${paramFourth}`;
                            } else {
                                return `https://audio00.forvo.com/mp3/${paramFirst}`;
                            }
                        });
                        audioObj.author = await pronLi.$eval('span.ofLink', element => element.innerText);
                        audioArray.push(audioObj);
                    }
                }
                break;
            }
        }
        return audioArray;
    } catch (err) {
        console.log(err);
        return [];
    }
    
};

describe("Little D", () => {
    let browser, page;
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true, 
            timeout: 0});
        page = await browser.newPage();
        await page.setViewport({height: 0, width: 0});
    })

    it('GetWord', async () => {

        let AnkiCardArray = [];
        for (word of wordList) {
            let wordArray = [];
            let audioArray = [];
            wordArray = await littleDCrawler(page, word);
            if (word.Array.length > 0) {
                audioArray = await ForvoCrawler(page, word);
            }
            
            const FILENAME = `Jp_${word}.mp3`;
            let AUTHOR_FOUND = false;
            let cacheAuthorObj = '';
            for (audioElement of audioArray) {
                if (audioElement.author === PRIOR_AUTHOR) {
                    request.get(audioElement.audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
                    AUTHOR_FOUND = true;
                    break;
                } else if (AUTHOR_LIST.includes(audioElement.author)) {
                    cacheAuthorObj = audioElement;
                    AUTHOR_FOUND = true;
                }
            }
            if (AUTHOR_FOUND && cacheAuthorObj) {
                request.get(cacheAuthorObj.audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
            } else if (audioArray.length > 0) {
                request.get(audioArray[0].audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
            }

            let AnkiCard = {
                front_word: '',
                back_word: '',
                read_word: '',
            }
            AnkiCard.front_word = `[sound:${FILENAME}]${word}<br>`;

            AnkiCard = sentenceParsing(wordArray, AnkiCard);
            AnkiCardArray.push(AnkiCard);
        }

        fs.writeFile(EXPORT_JSON_DIR, JSON.stringify(AnkiCardArray), (err) => {
            if (err) {
                console.error(err);
                return;
            };
        });
    })
   
    afterAll(async () => {
        await browser.close();
    })
})