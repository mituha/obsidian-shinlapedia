import { CommentEntry } from "src/models/CommentEntry"; 

export class CommentEntryFormatter {
    public static format(comment: CommentEntry): string {
        const { content, alignment, role, name } = comment;
        const formattedComment = content.replace(/\n/g, ' '); //１行で表示想定。リスト化等は上位とします。
        //投稿者はの要素は匿名の場合もある。
        let author = `${alignment || ""}${role || ""} ${name || ""}`.trim();
        if(!author) {
            author = `匿名`;
        }
        return formattedComment + ` -- ${author}`;
    }
}
