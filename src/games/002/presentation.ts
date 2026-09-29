// Translate engine feedback at the presentation boundary; simulation stays unchanged.
export function breakNotice(text: string): string {
  const messages: Record<string, string> = {
    "FEVER ×2 SCORE": "フィーバー！ スコア2倍",
    "NEXT ROW ↓": "新しい列が来ます ↓",
    "FINAL ROW!": "最後の追加列！",
    "WIDE PADDLE": "バーが広がった！",
    "POWER BALL": "ブロックを突き抜ける！",
    "MULTI BALL ×3": "ボールが3つに！",
    "MISS · TRY AGAIN": "もう一度、ボールを発射しよう",
  };
  if (messages[text]) return messages[text];
  return text
    .replace(/^(\d+) COMBO/, "$1 コンボ")
    .replace(/^ROW ADDED · (\d+) LEFT$/, "列を追加！ あと$1列");
}
