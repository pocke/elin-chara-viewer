/**
 * 耐性関連のユーティリティ関数
 *
 * 耐性ラベル定義:
 * - <= -10: "致命的な弱点" / "Defect"
 * - <= -5: "弱点" / "Weakness"
 * - === 0: "なし" / "None"
 * - >= 20: "免疫" / "Immunity"
 * - >= 15: "素晴らしい耐性" / "Superb"
 * - >= 10: "強い耐性" / "Strong"
 * - >= 5: "耐性" / "Normal"
 */

/**
 * 耐性値に基づいてラベルを取得する
 */
export const getResistanceLabel = (
  value: number,
  t: (key: string) => string
): string => {
  if (value <= -10) return t('common:resistanceDefect');
  if (value <= -5) return t('common:resistanceWeakness');
  if (value === 0) return t('common:resistanceNone');
  if (value >= 20) return t('common:resistanceImmunity');
  if (value >= 15) return t('common:resistanceSuperb');
  if (value >= 10) return t('common:resistanceStrong');
  if (value >= 5) return t('common:resistanceNormal');
  return t('common:resistanceNone');
};

/**
 * 耐性値の簡潔な表示形式を取得する（テーブル用・数値と符号のみ）
 */
export const getResistanceDisplayValueCompact = (value: number): string => {
  if (value > 0) {
    return `+${value}`;
  } else if (value < 0) {
    return `${value}`;
  } else {
    return '0';
  }
};
