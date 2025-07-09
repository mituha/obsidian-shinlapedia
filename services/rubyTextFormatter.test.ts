import { describe, it, expect } from 'vitest';
import { formatRuby } from './rubyTextFormatter';

describe('formatRuby', () => {
    it('基本的なルビ変換が正しく行われること', () => {
        const inputText = 'これは|漢字《かんじ》のテストです。';
        const expectedOutput = 'これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。';
        expect(formatRuby(inputText)).toBe(expectedOutput);
    });

    it('ルビが含まれないテキストは変更されないこと', () => {
        const inputText = 'これは通常のテキストです。';
        expect(formatRuby(inputText)).toBe(inputText);
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

    it('空の文字列が入力された場合に空の文字列が返されること', () => {
        const inputText = '';
        expect(formatRuby(inputText)).toBe('');
    });

    it('ルビの記号のみで中身がない場合は変換されないこと', () => {
        const inputText = 'これは|《》テストです。';
        expect(formatRuby(inputText)).toBe(inputText);
    });

    it('複雑な文字列の中にルビが含まれている場合に正しく変換されること', () => {
        const inputText = 'これは、|複雑《ふくざつ》な文章の|中間《ちゅうかん》にルビを|含《ふく》むテストです。';
        const expectedOutput = 'これは、<ruby>複雑<rt>ふくざつ</rt></ruby>な文章の<ruby>中間<rt>ちゅうかん</rt></ruby>にルビを<ruby>含<rt>ふく</rt></ruby>むテストです。';
        expect(formatRuby(inputText)).toBe(expectedOutput);
    });
});
