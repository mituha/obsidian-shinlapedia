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
    // これを先に処理することで、漢字以外の文字を含む場合や、意図的に��切り文字を使いたいケースを正しく処理する。
    const pipeRubyRegex = /[|｜]([^《》]+)《([^》]+)》/g;
    formattedText = formattedText.replace(pipeRubyRegex, '<ruby>$1<rt>$2</rt></ruby>');

    // 2. 傍点: `《《対象文字列》》` -> <em class="emphasis-dot">対象文字列</em>
    // ルビの二重山括弧と区別するため、ルビ処理の間に実行する。
    const boutenRegex = /《《([^》]+)》》/g;
    formattedText = formattedText.replace(boutenRegex, '<em class="emphasis-dot">$1</em>');

    // 3. ルビ（区切り文字なし）: `漢字《ルビ》` (親文字は漢字のみ)
    // 親文字が漢字のみで構成されている場合にのみマッチする。
    // [\u4E00-\u9FFF]は一般的な漢字の範囲。
    const kanjiRubyRegex = /([\u4E00-\u9FFF]+)《([^》]+)》/g;
    formattedText = formattedText.replace(kanjiRubyRegex, '<ruby>$1<rt>$2</rt></ruby>');

    return formattedText;
}
