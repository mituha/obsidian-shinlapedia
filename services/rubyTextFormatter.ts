/**
 * 指定されたテキスト内の特定の書式（例：|漢字《かんじ》）をHTMLの<ruby>タグに変換します。
 * @param text 変換対象のテキスト
 * @returns 変換後のテキスト（<ruby>タグを含むHTML文字列）
 */
export function formatRuby(text: string): string {
    // カクヨム形式のルビの正規表現
    // |漢字《ルビ》
    const regex = /\|([^《》]+)《([^》]+)》/g;

    return text.replace(regex, (match, p1, p2) => {
        return `<ruby>${p1}<rt>${p2}</rt></ruby>`;
    });
}
