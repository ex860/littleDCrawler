let puppeteer = require('puppeteer');
let request = require('request');
let fs = require('fs');
let opencc = require('node-opencc');
const WAITING = 50;

const LITTLED_URL = 'https://dict.hjenglish.com/jp/';
const FORVO_URL = 'https://forvo.com/word'
const OJAD_URL = 'http://www.gavo.t.u-tokyo.ac.jp/ojad';

const GENDER = 'male';

// const VERB_TYPE = ['jisho', 'masu', 'te', 'ta', 'nai', 'nakatta', 'ba', 'shieki', 'ukemi', 'meirei', 'kano', 'ishi'];
const VERB_TYPE = ['jisho', 'masu', 'te'];
const AUTHOR_LIST = ['akitomo', 'kaoring', 'kyokotokyojapan', 'kiiro', 'yasuo', 'sorechaude', 'Phlebia'];
const PRIOR_AUTHOR = 'strawberrybrown';

const DOWNLOAD_DIR = 'C:/Users/Yu-Hsien/AppData/Roaming/Anki2/YuHsien/collection.media/';
const EXPORT_JSON_DIR = 'C:/Users/Yu-Hsien/Desktop/Ankieasy/littleDJSON.json';

const wordList = [
];
const verbList = [
];

String.prototype.replaceAll = function(s1, s2) {
    let result = this;
    for (token of s1) {
        result = result.replace(new RegExp(token, "gm"), s2);
    }
    return result;
}

const sentenceParsing = (meaningArray, AnkiCard) => {
    meaningArray.map(readWord => {
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

    console.log('input');
    await page.waitFor('input[name="word"]');
    await page.type('input[name="word"]', word);
    await page.waitFor(1000);

    console.log('button');
    await page.waitFor('button[data-trans="jc"]');
    await page.click('button[data-trans="jc"]');
    try {
        await page.waitFor('section.detail-groups');
        let detailGroups = await page.$$('section.detail-groups');
        let meaningArray = [];
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
            meaningArray.push(POSArray);
        }
        return meaningArray;
    } catch (err) {
        console.log(err);
        return [];
    }
    
}

const OJADCrawler = async (page, word) => {
    const getStem = (jisho, jishoGana) => {
        let index = -1;
        let match = false;
        let rest = '';
        do {
            if (jisho.substr(index) === jishoGana.substr(index)) {
                index--;
                match = true;
            } else {
                match = false;
            }
        } while (match) 
        index++;
        rest = jisho.substr(index);
        return {
            kanji: jisho.replace(rest, ''),
            gana: jishoGana.replace(rest, ''),
        };
    };
    await page.goto(`${OJAD_URL}/search/index/word:${word}`);
    await page.waitFor(WAITING);
    let content = '';
    try {
        await page.waitFor('#search_result.ojad_dropshadow_standalone');
        let resultTable = await page.$('#search_result.ojad_dropshadow_standalone #word_table.draggable');
        if (resultTable) {
            let rows = await resultTable.$$('tbody tr[id]'); // tr[id] means <tr id="some value"> 
            for (row of rows) {
                let midashi = await row.$eval(`td.midashi`, n => n.innerText.trim());
                let jisho = midashi.split('・')[0];
                let masu = midashi.split('・')[1];
                let stem = {};
                if (word === jisho) {
                    for (verbType of VERB_TYPE) {
                        let proc = await row.$(`td.katsuyo.katsuyo_${verbType}_js div.katsuyo_proc`);
                        if (proc) {
                            let gana = '';
                            switch (verbType) {
                                case 'jisho': {
                                    let jishoGana = await proc.$eval('p', n => n.innerText);
                                    stem = getStem(jisho, jishoGana);
                                    gana = jisho;
                                    break;
                                }
                                case 'masu':
                                    gana = masu;
                                    break;
                                default: {
                                    let originGana = await proc.$eval('p', n => n.innerText);
                                    gana = originGana.replace(stem.gana, stem.kanji);
                                    break;
                                }
                            }
                            let buttonId = await proc.$eval(`a.katsuyo_proc_${GENDER}_button.js_proc_${GENDER}_button`, n => n.getAttribute('id'));
                            // 把數字後兩位數截掉 前面加兩個0 再取後三位
                            let idStrNum = (`00${String(Math.floor(Number.parseInt(buttonId.substr(0, buttonId.indexOf('_') + 1)) / 100))}`).substr(-3);
                            let pronUrl = `${OJAD_URL}/sound4/mp3/${GENDER}/${idStrNum}/${buttonId}.mp3`;
                            await request.get(pronUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${buttonId}.mp3`));
                            content += `[sound:${buttonId}.mp3]${gana}<br>`;
                        }
                    }
                }
            }
            if (!content) {
                console.log("<< OJAD verb candidates didn't match the input verb !!! >>")
            }
        } else {
            console.log('<< OJAD verb not found !!! >>');
        }
    } catch (err) {
        console.log(err);
    }
    return {
        front_word: content,
        back_word: '',
        read_word: '',
    };
};

const ForvoCrawler = async (page, word) => {
    await page.goto(`${FORVO_URL}/${word}/#ja`);
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
                            const paramFirst = atob(playParams[1].substr(1, playParams[1].length-1));
                            const paramFourth = atob(playParams[4].substr(1, playParams[4].length-1));
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

(async () => {
    let browser, page;
    browser = await puppeteer.launch({
        headless: true, 
        timeout: 0
    });
    page = await browser.newPage();
    await page.setViewport({height: 0, width: 0});

    let AnkiCardArray = [];
    for (let i = 0; i < verbList.length; i++) {
        let meaningArray = [];
        meaningArray = await littleDCrawler(page, verbList[i]);
        let OJADFrame = await OJADCrawler(page, verbList[i]);
        AnkiCard = sentenceParsing(meaningArray, OJADFrame);
        AnkiCardArray.push(AnkiCard);
    }

    for (word of wordList) {
        let meaningArray = [];
        let audioArray = [];
        meaningArray = await littleDCrawler(page, word);
        if (meaningArray.length > 0) {
            audioArray = await ForvoCrawler(page, word);
        }
        
        const FILENAME = `Jp_${word}.mp3`;
        let PRIOR_AUTHOR_FOUND = false;
        let AUTHOR_FOUND = false;
        for (audioElement of audioArray) {
            if (audioElement.author === PRIOR_AUTHOR) {
                await request.get(audioElement.audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
                PRIOR_AUTHOR_FOUND = true;
                break;
            } else if (AUTHOR_LIST.includes(audioElement.author)) {
                await request.get(audioElement.audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
                AUTHOR_FOUND = true;
                break;
            }
        }
        if (!PRIOR_AUTHOR_FOUND && !AUTHOR_FOUND) {
            await request.get(audioArray[0].audioUrl).pipe(fs.createWriteStream(`${DOWNLOAD_DIR}/${FILENAME}`));
        }

        let AnkiCard = {
            front_word: '',
            back_word: '',
            read_word: '',
        }
        AnkiCard.front_word = `[sound:${FILENAME}]${word}<br>`;

        AnkiCard = sentenceParsing(meaningArray, AnkiCard);
        AnkiCardArray.push(AnkiCard);
    }

    fs.writeFile(EXPORT_JSON_DIR, JSON.stringify(AnkiCardArray), (err) => {
        if (err) {
            console.error(err);
            return;
        };
    });

    browser.close();
})();