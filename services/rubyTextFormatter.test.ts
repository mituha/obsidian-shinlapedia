import { describe, it, expect } from 'vitest';
import { formatRuby } from './rubyTextFormatter';

describe('formatRuby', () => {

    describe('ルビ（区切り文字あり）', () => {
        it('基本的なルビ変換が正しく行われること', () => {
            const inputText = 'これは|漢字《かんじ》のテストです。';
            const expectedOutput = 'これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('複数のルビが正しく変換されること', () => {
            const inputText = '|漢字《かんじ》と|単語《たんご》のテスト。';
            const expectedOutput = '<ruby>漢字<rt>かんじ</rt></ruby>と<ruby>単語<rt>たんご</rt></ruby>のテスト。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('文頭と文末のルビが正しく変換されること', () => {
            const inputText = '|文頭《ぶんとう》のルビと、文末の|ルビ《るび》';
            const expectedOutput = '<ruby>文頭<rt>ぶんとう</rt></ruby>のルビと、文末の<ruby>ルビ<rt>るび</rt></ruby>';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('全角の区切り文字「｜」を使ったルビ変換が正しく行われる���と', () => {
            const inputText = 'これは｜漢字《かんじ》のテストです。';
            const expectedOutput = 'これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('半角と全角の区切り文字が混在している場合に正しく変換されること', () => {
            const inputText = '|漢字《かんじ》と｜単語《たんご》のテスト。';
            const expectedOutput = '<ruby>漢字<rt>かんじ</rt></ruby>と<ruby>単語<rt>たんご</rt></ruby>のテスト。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('ひらがな・カタカナ・英数字も親文字にできること', () => {
            const inputText = '|etc《えとせとら》や｜あいうえお《アイウエオ》も変換される。';
            const expectedOutput = '<ruby>etc<rt>えとせとら</rt></ruby>や<ruby>あいうえお<rt>アイウエオ</rt></ruby>も変換される。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });
    });

    describe('ルビ（区切り文字なし）', () => {
        it('親文字が漢字の場合に正しく変換されること', () => {
            const inputText = 'これは漢字《かんじ》のテストです。';
            const expectedOutput = 'これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('親文字が漢字でない場合は変換されないこと', () => {
            const inputText = 'これはひらがな《ひらがな》やabc《エービーシー》のテストです。';
            expect(formatRuby(inputText)).toBe(inputText);
        });

        it('区切り文字ありの記法と混在している場合に正しく変換されること', () => {
            const inputText = '彼女《ヒロイン》の名前は|山田《やまだ》です。';
            const expectedOutput = '<ruby>彼女<rt>ヒロイン</rt></ruby>の名前は<ruby>山田<rt>やまだ</rt></ruby>です。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });
    });

    describe('傍点', () => {
        it('基本的な傍点が正しく変換されること', () => {
            const inputText = 'これは《《傍点》》のテストです。';
            const expectedOutput = 'これは<em class="emphasis-dot">傍点</em>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('複数の傍点が正しく変換されること', () => {
            const inputText = '《《ここ》》と《《そこ》》に傍点。';
            const expectedOutput = '<em class="emphasis-dot">ここ</em>と<em class="emphasis-dot">そこ</em>に傍点。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('ルビと傍点が混在している場合に両方正しく変換されること', () => {
            const inputText = 'これは|ルビ《るび》と《《傍点》》のテストです。';
            const expectedOutput = 'これは<ruby>ルビ<rt>るび</rt></ruby>と<em class="emphasis-dot">傍点</em>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });
    });

    describe('一般ケース', () => {
        it('ルビや傍点が含まれないテキストは変更されないこと', () => {
            const inputText = 'これは通常のテキストです。';
            expect(formatRuby(inputText)).toBe(inputText);
        });

        it('空の文字列が入力された場合に空の文字列が返されること', () => {
            const inputText = '';
            expect(formatRuby(inputText)).toBe('');
        });

        it('不正な形式の記法は変換されないこと', () => {
            const inputText = 'これは|《》や《》、漢字《》のテストです。';
            expect(formatRuby(inputText)).toBe(inputText);
        });
    });
});
