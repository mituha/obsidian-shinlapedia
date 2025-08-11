export class CommentEntry {
    //コメント内容
    content: string;

    /* 
     * 表示名は[陽気な][VTuber][猫乃わん太]のように、複数の要素を組み合わせて表現することができます
     * 特性《アライメント》：陽気な
     * 役職《ロール》：VTuber
     * 名前：猫乃わん太
     * [特性][役職][名前]で表示されます。
     * それぞれの要素は未使用でも問題ありません。
     */

    //特性《アライメント》
    alignment?: string;
    //役職《ロール》
    role?: string;
    //名前
    name?: string;


    constructor(
        content: string,
        options: {
            alignment?: string;
            role?: string;
            name?: string;
        } = {}
    ) {
        this.content = content;
        this.alignment = options.alignment;
        this.role = options.role;
        this.name = options.name;
    }
    public static getJSONSchema() {
        return {
            type: "object",
            properties: {
                content: { type: "string", description: "コメント内容" },
                alignment: { type: "string", description: "投稿者の特性《アライメント》を表す形容詞" },
                role: { type: "string", description: "投稿者の役職《ロール》" },
                name: { type: "string", description: "投稿者の名前" }
            },
            required: ["content"]
        };
    }
    public static fromJSON(json: any): CommentEntry {
        const content = json.content;
        const alignment = json.alignment;
        const role = json.role;
        const name = json.name;

        return new CommentEntry(content, { alignment, role, name });
    }