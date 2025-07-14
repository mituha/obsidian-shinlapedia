import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatRuby, applyRubyToElement } from './rubyTextFormatter';
import { JSDOM } from 'jsdom';

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

        it('全角の区切り文字「｜」を使ったルビ変換が正しく行われること', () => {
            const inputText = 'これは｜漢字《かんじ》のテストです。';
            const expectedOutput = 'これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。';
            expect(formatRuby(inputText)).toBe(expectedOutput);
        });

        it('半角と全角の区切り文字が混在している場合に正しく変換される��と', () => {
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

    describe('一般��ース', () => {
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

describe('applyRubyToElement', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html>');
        document = dom.window.document;
        global.document = document;
        global.NodeFilter = dom.window.NodeFilter;
        global.HTMLElement = dom.window.HTMLElement;
        global.Node = dom.window.Node;
        global.DocumentFragment = dom.window.DocumentFragment;
    });

    it('単一のテキストノード内のルビ記法を正しく変換すること', () => {
        const element = document.createElement('div');
        element.textContent = 'これは|漢字《かんじ》のテストです。';
        applyRubyToElement(element);
        expect(element.innerHTML).toBe('これは<ruby>漢字<rt>かんじ</rt></ruby>のテストです。');
    });

    it('複数のテキストノードにまたがるルビ記法をそれぞれ正しく変換すること', () => {
        const element = document.createElement('div');
        const p1 = document.createElement('p');
        p1.textContent = '一つ目の段落、|漢字《かんじ》。';
        const p2 = document.createElement('p');
        p2.textContent = '二つ目の段落、｜単語《たんご》。';
        element.appendChild(p1);
        element.appendChild(p2);

        applyRubyToElement(element);

        expect(element.innerHTML).toBe('<p>一つ目の段落、<ruby>漢字<rt>かんじ</rt></ruby>。</p><p>二つ目の段落、<ruby>単語<rt>たんご</rt></ruby>。</p>');
    });

    it('ルビと傍点が混在するテキストを正しく変換すること', () => {
        const element = document.createElement('div');
        element.textContent = 'これは|ルビ《るび》と《《傍点》》のテストです。';
        applyRubyToElement(element);
        expect(element.innerHTML).toBe('これは<ruby>ルビ<rt>るび</rt></ruby>と<em class="emphasis-dot">傍点</em>のテストです。');
    });

    it('記法が含まれないテキストは変更されないこと', () => {
        const element = document.createElement('div');
        const originalText = 'これは通常のテキストです。';
        element.textContent = originalText;
        applyRubyToElement(element);
        expect(element.innerHTML).toBe(originalText);
    });

    it('子要素内のテキストノードも正しく変換すること', () => {
        const element = document.createElement('div');
        element.innerHTML = '<span>これは|スパン《span》タグの中です。</span>';
        applyRubyToElement(element);
        expect(element.innerHTML).toBe('<span>これは<ruby>スパン<rt>span</rt></ruby>タグの中です。</span>');
    });

    it('テキストノードが分割されていても正しく変換すること', () => {
        const element = document.createElement('div');
        element.appendChild(document.createTextNode('これは|分割《ぶんかつ》された'));
        element.appendChild(document.createElement('b'));
        element.lastChild!.textContent = 'テキスト';
        element.appendChild(document.createTextNode('です。'));

        applyRubyToElement(element);
        expect(element.innerHTML).toBe('これは<ruby>分割<rt>ぶんかつ</rt></ruby>された<b>テキスト</b>です。');
    });

    it('空の要素に対してエラーが発生しないこと', () => {
        const element = document.createElement('div');
        expect(() => applyRubyToElement(element)).not.toThrow();
    });

    afterEach(() => {
        // @ts-ignore
        delete global.document;
        // @ts-ignore
        delete global.NodeFilter;
        // @ts-ignore
        delete global.HTMLElement;
        // @ts-ignore
        delete global.Node;
        // @ts-ignore
        delete global.DocumentFragment;
    });
});