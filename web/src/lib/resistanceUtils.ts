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

import { Translations } from './simple-i18n';

/**
 * 耐性値に基づいてラベルを取得する
 */
export const getResistanceLabel = (
  value: number,
  translations: Translations
): string => {
  if (value <= -10) return translations.common.resistanceDefect;
  if (value <= -5) return translations.common.resistanceWeakness;
  if (value === 0) return translations.common.resistanceNone;
  if (value >= 20) return translations.common.resistanceImmunity;
  if (value >= 15) return translations.common.resistanceSuperb;
  if (value >= 10) return translations.common.resistanceStrong;
  if (value >= 5) return translations.common.resistanceNormal;
  return translations.common.resistanceNone;
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
