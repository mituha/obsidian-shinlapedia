/**
 * 指定されたテキスト内のカクヨム記法（ルビ、傍点）をHTMLタグに変換します。
 * https://kakuyomu.jp/help/entry/notation
 * @param text 変換対象のテキスト
 * @returns 変換後のテキスト（HTMLタグを含む文字列）
 */
export function formatRuby(text: string): string {
    let formattedText = text;

    // 処理の順序が重要。より具体的なルールから先に適用する。

    // 1. ルビ（区切り文字あり）: `|親文字《ルビ》` or `｜親文字《ルビ》` (親文字は任意)
    // これを先に処理することで、漢字以外の文字を含む場合や、意図的に区切り文字を使いたいケースを正しく処理する。
    const pipeRubyRegex = /[|｜]([^《》]+)《([^》]+)》/g;
    formattedText = formattedText.replace(pipeRubyRegex, '<ruby>$1<rt>$2</rt></ruby>');

    // 2. 傍点: `《《対象文字列》》` -> <em class="emphasis-dot">対象文字列</em>
    // ルビの��重山括弧と区別するため、ルビ処理の間に実行する。
    const boutenRegex = /《《([^》]+)》》/g;
    formattedText = formattedText.replace(boutenRegex, '<em class="emphasis-dot">$1</em>');

    // 3. ルビ（区切り文字なし）: `漢字《ルビ》` (親文字は漢字のみ)
    // 親文字が漢字のみで構成されている場合にのみマッチする。
    // [\u4E00-\u9FFF]は一般的な漢字の範囲。
    const kanjiRubyRegex = /([\u4E00-\u9FFF]+)《([^》]+)》/g;
    formattedText = formattedText.replace(kanjiRubyRegex, '<ruby>$1<rt>$2</rt></ruby>');

    return formattedText;
}


/**
 * 指定されたHTML要素内のテキストノードを走査し、カクヨム記法をHTMLタグに変換します。
 * この関数は、DOMを直接操作するため、Markdownのレンダリング後処理などで使用することを想定しています。
 * @param element 処理対象のHTML要素
 */
export function applyRubyToElement(element: HTMLElement): void {
    // テキストノードのみを対象とするため、TreeWalkerを使用す��
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    const nodesToReplace: { oldNode: Node, newNode: DocumentFragment }[] = [];

    while (node = walker.nextNode()) {
        const textContent = node.textContent;
        if (!textContent) continue;

        // カクヨム記法が含まれているかチェック
        if (/[|｜《》]/.test(textContent)) {
            const formattedHtml = formatRuby(textContent);

            // 変換が行われた場合のみDOMを操作する
            if (formattedHtml !== textContent) {
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formattedHtml;

                // tempDivの子ノードをfragmentに移動
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }

                // 後で置き換えるために、元のノードと新しいフラグメントを保存
                nodesToReplace.push({ oldNode: node, newNode: fragment });
            }
        }
    }

    // DOMの変更は、走査が完了してから一括で行う
    // これにより、TreeWalkerの動作が不安定になるのを防ぐ
    nodesToReplace.forEach(({ oldNode, newNode }) => {
        oldNode.parentNode?.replaceChild(newNode, oldNode);
    });
}