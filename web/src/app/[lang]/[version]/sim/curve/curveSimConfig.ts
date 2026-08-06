/**
 * Curveシミュレーション用のUI設定
 */
import type { CurveParams } from '@/lib/curveUtils';

/** プリセットの型定義 */
export interface CurvePreset {
  /** プリセットID */
  id: string;
  /** 表示名（翻訳キー） */
  nameKey: string;
  /** パラメータ */
  params: CurveParams;
}

/** デフォルトのプリセット一覧（減衰が弱い順） */
export const DEFAULT_PRESETS: CurvePreset[] = [
  {
    id: 'spellCount',
    nameKey: 'spellCount',
    params: { start: 50, step: 20, rate: 75 },
  },
  {
    id: 'stamina',
    nameKey: 'stamina',
    params: { start: 30, step: 10, rate: 60 },
  },
  {
    id: 'bounty',
    nameKey: 'bounty',
    params: { start: 20, step: 15, rate: 75 },
  },
];

/** デフォルトのCurveパラメータ */
export const DEFAULT_CURVE_PARAMS: CurveParams = {
  start: 10,
  step: 10,
  rate: 75,
};

/** デフォルトの入力範囲 */
export const DEFAULT_RANGE = {
  start: 0,
  end: 100,
};

/** 設定セットの型定義（複数設定比較用） */
export interface CurveConfigSet {
  /** 設定ID */
  id: string;
  /** 表示名 */
  name: string;
  /** Curveパラメータ */
  params: CurveParams;
  /** 表示色 */
  color: string;
}

/** 比較用のカラーパレット */
export const CONFIG_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
];

/**
 * 新しい設定セットを作成
 */
export function createConfigSet(
  index: number,
  params: CurveParams = DEFAULT_CURVE_PARAMS
): CurveConfigSet {
  return {
    id: `config-${Date.now()}-${index}`,
    name: `設定 ${index + 1}`,
    params,
    color: CONFIG_COLORS[index % CONFIG_COLORS.length],
  };
}
