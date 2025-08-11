/**
 * 使用者によるプライベートなメモのエントリ
 */
export class MemoEntry {
    /**
     * メモの本文
     */
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    public static getJSONSchema() {
        return {
            type: "OBJECT",
            properties: {
                text: { type: "STRING", description: "メモ本文" }
            },
            required: ["text"]
        };
    }

    public static fromJSON(json: any): MemoEntry {
        return new MemoEntry(json.text);
    }
}
