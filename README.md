# littleDCrawler
> littleDCrawler is a Japanese dictionary web crawler.<br>
> It crawls [LittleD](https://dict.hjenglish.com/jp/) for Japanese word and [OJAD](http://www.gavo.t.u-tokyo.ac.jp/ojad/) for Japanese verb.<br>
> After finishing crawling, it exports JSON for [Ankieasy](https://github.com/ex860/Ankieasy) to make card.

### Usage
```
node littleD.js [type] 
```

### Type
- <code>image</code>: littleD.js will read the image folder, and embed the image file in into your Anki card.
- <code>python</code>: littleD.js will read the input file of [Ankieasy](https://github.com/ex860/Ankieasy) for input word information.

### Output JSON Format
- front_word (Japanese):
  - word:
    ```
    [sound:<AUDIO_PATH>]<WORD>
    <PART_OF_SPEECH>
    1. <MEANING_1_EXAMPLE_SENTENCE>
    (2. <MEANING_2_EXAMPLE_SENTENCE>)
    ...
    ```
  - verb:
    ```
    [sound:<JISHO_AUDIO_PATH>]<VERB_JISHO> // 辞書形
    [sound:<MASU_AUDIO_PATH>]<VERB_MASU>   // ます形
    [sound:<TE_AUDIO_PATH>]<VERB_TE>       // て形
    [sound:<NAI_AUDIO_PATH>]<VERB_NAI>     // ない形
    ([sound:<KANO_AUDIO_PATH>]<VERB_KANO>  // 可能形)
    [sound:<ISHI_AUDIO_PATH>]<VERB_ISHI>   // 意志形
    <PART_OF_SPEECH>
    1. <MEANING_1_EXAMPLE_SENTENCE>
    (2. <MEANING_2_EXAMPLE_SENTENCE>)
    ...
    ```
- back_word (Chinese):
    ```
    <PART_OF_SPEECH>
    1. <MEANING_1>
    <MEANING_1_EXAMPLE_SENTENCE>
    (2. <MEANING_2>)
    (<MEANING_2_EXAMPLE_SENTENCE>)
    ...
    ```


if you can't install puppeteer, try this:
```
sudo npm install --unsafe-perm=true
```