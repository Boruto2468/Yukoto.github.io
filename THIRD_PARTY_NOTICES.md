# Yukoto third-party data notices

## HSK 2.0 vocabulary metadata and glosses
Source: [HearMandarin HSK word-list dataset](https://hearmandarin.com/datasets/), dataset version 2026-09-28. The combined file includes HSK 2.0 level fields based on the 2015 HSK 2.0 word list. Licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: HearMandarin (https://hearmandarin.com).

## HSK 3.0 vocabulary, examples, and reading characters
Source: [HSK 3.0 syllabus data by Gushi](https://gushichinese.com/hsk-3.0/downloads), based on the official syllabus published in November 2025; checked 2026-10-14. Licensed under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution: HSK 3.0 syllabus data by Gushi, https://gushichinese.com/hsk-3.0/downloads. Adapted HSK 3.0 data must retain attribution and be shared under CC BY-SA 4.0. The examples come largely from Tatoeba (CC BY 2.0 FR) and examples written for Gushi, as described by Gushi.

## Mandarin tone recordings
The Pinyin lesson includes unmodified copies of the first four Mandarin tone examples in `public/audio`: [tone 1](https://commons.wikimedia.org/wiki/File:Wikiversity_mandarin_ma1.ogg), [tone 2](https://commons.wikimedia.org/wiki/File:Wikiversity_mandarin_ma2.ogg), [tone 3](https://commons.wikimedia.org/wiki/File:Wikiversity_mandarin_ma3.ogg), and [tone 4](https://commons.wikimedia.org/wiki/File:Wikiversity_mandarin_ma4.ogg). Recordings by Kefengx; licensed under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The neutral-tone example is spoken in context using browser speech synthesis.

## Curriculum audio exclusion
The source CSV includes audio URL fields, but Yukoto intentionally does not store or hotlink those recordings because Gushi explicitly excludes synthesized audio from the data licence. Browser speech synthesis remains in use for the rest of the app.

## Import provenance
This local import was produced from three CSV files supplied by the project operator. SHA-256 fingerprints and original source URLs are recorded in src/data/curriculum.json. The import validates all six HSK 2.0 vocabulary levels, all six HSK 3.0 vocabulary levels, and all six HSK 3.0 reading-character levels against the currently documented level counts.
