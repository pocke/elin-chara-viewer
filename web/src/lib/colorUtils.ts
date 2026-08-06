/**
 * 16進数の色コードから相対輝度を計算し、適切なテキスト色（白または黒）を返す
 */
export function getContrastColor(hexColor: string): string {
  // #記号を削除
  const hex = hexColor.replace('#', '');

  // RGB値を取得
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // 相対輝度を計算（WCAG 2.1の式を使用）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 閾値0.5で白黒を判定
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
