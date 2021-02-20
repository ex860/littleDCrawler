const WAITING = 50;
const TIMEOUT = 20000;
const HEADLESS_MODE = true;

const LITTLED_URL = 'https://dict.hjenglish.com/jp/';
const FORVO_URL = 'https://forvo.com/word';
const OJAD_URL = 'http://www.gavo.t.u-tokyo.ac.jp/ojad';

const GENDER = 'male';

// const VERB_TYPE = ['jisho', 'masu', 'te', 'ta', 'nai', 'nakatta', 'ba', 'shieki', 'ukemi', 'meirei', 'kano', 'ishi'];
const VERB_TYPE = ['jisho', 'masu', 'te', 'nai', 'kano', 'ishi'];
const AUTHOR_LIST = ['akitomo', 'kaoring', 'kyokotokyojapan', 'kiiro', 'yasuo', 'sorechaude', 'Phlebia'];
const PRIOR_AUTHOR = 'strawberrybrown';

let DOWNLOAD_DIR = '';
let EXPORT_JSON_DIR = '';
let EXPORT_LOG_DIR = '';
let WORD_IMGAE_FOLDER_DIR = '';
let VERB_IMGAE_FOLDER_DIR = '';
let OUTER_WORD_LIST_DIR = '';
let SPLITTER = ''

// console.log(process.platform)
switch (process.platform) {
    case 'win32':
        DOWNLOAD_DIR = 'C:/Users/Yu-Hsien/AppData/Roaming/Anki2/YuHsien/collection.media/';
        EXPORT_JSON_DIR = 'C:/Users/Yu-Hsien/Desktop/Automanki/littleDJSON.json';
        EXPORT_LOG_DIR = 'C:/Users/Yu-Hsien/Desktop/Automanki/log.txt';
        WORD_IMGAE_FOLDER_DIR = 'C:/Users/Yu-Hsien/Desktop/word';
        VERB_IMGAE_FOLDER_DIR = 'C:/Users/Yu-Hsien/Desktop/verb';
        OUTER_WORD_LIST_DIR = 'C:/Users/Yu-Hsien/Desktop/Automanki/input_JP.txt';
        SPLITTER = '\r\n';
        break;
    case 'linux':
        DOWNLOAD_DIR = '/home/yu/.local/share/Anki2/YuHsien/collection.media/';
        EXPORT_JSON_DIR = '/home/yu/Desktop/littleDJSON.json';
        EXPORT_LOG_DIR = '/home/yu/Desktop/Ankieasy/log.txt';
        WORD_IMGAE_FOLDER_DIR = '/home/yu/Desktop/word';
        VERB_IMGAE_FOLDER_DIR = '/home/yu/Desktop/verb';
        OUTER_WORD_LIST_DIR = '/home/yu/Desktop/Ankieasy/input/input_M.txt';
        SPLITTER = '\n';
        break;
    case 'darwin':
        DOWNLOAD_DIR = '/Users/yuhsien/Library/Application Support/Anki2/YuHsien/collection.media/';
        EXPORT_JSON_DIR = '/Users/yuhsien/Automanki/littleDJSON.json';
        EXPORT_LOG_DIR = '/Users/yuhsien/Automanki/log.txt';
        WORD_IMGAE_FOLDER_DIR = '';
        VERB_IMGAE_FOLDER_DIR = '';
        OUTER_WORD_LIST_DIR = '/Users/yuhsien/Automanki/input_JP.txt';
        SPLITTER = '\n';
        break;
}

module.exports = {
    WAITING,
    TIMEOUT,
    HEADLESS_MODE,
    LITTLED_URL,
    FORVO_URL,
    OJAD_URL,
    GENDER,
    VERB_TYPE,
    AUTHOR_LIST,
    PRIOR_AUTHOR,
    DOWNLOAD_DIR,
    EXPORT_JSON_DIR,
    EXPORT_LOG_DIR,
    WORD_IMGAE_FOLDER_DIR,
    VERB_IMGAE_FOLDER_DIR,
    OUTER_WORD_LIST_DIR,
    SPLITTER,
};