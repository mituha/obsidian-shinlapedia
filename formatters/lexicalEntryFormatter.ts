import { LexicalEntry } from '../models/lexicalEntry';

/**
 * LexicalEntryオブジェクトを様々な形式に変換するためのフォーマッタークラス
 */
export class LexicalEntryFormatter {

    /**
     * LexicalEntryオブジェクトをMarkdown形式の文字列に変換します。
     * @param entry - 変換対象のLexicalEntryオブジェクト
     * @returns Markdown形式の文字列
     */
    public static toMarkdown(entry: LexicalEntry): string {
        const parts: string[] = [];

        // 1. 見出し語
        parts.push(`# ${entry.lemma}`);
        parts.push('');

        // 2. 読みと品詞
        const subHeader: string[] = [];
        if (entry.reading) {
            subHeader.push(`*${entry.reading}*`);
        }
        subHeader.push(`【${entry.partOfSpeech}】`);
        parts.push(subHeader.join('  '));
        parts.push('');

        // 3. 定義
        if (entry.definitions && entry.definitions.length > 0) {
            parts.push('## 意味');
            entry.definitions.forEach((def, index) => {
                parts.push(`${index + 1}. ${def}`);
            });
            parts.push('');
        }

        // 4. 例文
        if (entry.examples && entry.examples.length > 0) {
            parts.push('## 例文');
            entry.examples.forEach(ex => {
                parts.push(`> ${ex.sentence}`);
                if (ex.source) {
                    parts.push(`> *— ${ex.source}*`);
                }
            });
            parts.push('');
        }

        // 5. 類義語
        if (entry.synonyms && entry.synonyms.length > 0) {
            parts.push('## 類義語');
            parts.push(entry.synonyms.map(s => `- ${s}`).join('\n'));
            parts.push('');
        }

        // 6. 対義語
        if (entry.antonyms && entry.antonyms.length > 0) {
            parts.push('## 対義語');
            parts.push(entry.antonyms.map(a => `- ${a}`).join('\n'));
            parts.push('');
        }
        
        // 7. タグ
        if (entry.tags && entry.tags.length > 0) {
            parts.push('---');
            parts.push(entry.tags.map(t => `#${t}`).join(' '));
        }

        return parts.join('\n').trim();
    }
}