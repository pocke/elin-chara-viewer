/**
 * ひらがなをカタカナに変換して検索用に正規化する
 * 小文字化 + ひらがな→カタカナ変換を行う
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (match) =>
      String.fromCharCode(match.charCodeAt(0) + 0x60)
    );
}
