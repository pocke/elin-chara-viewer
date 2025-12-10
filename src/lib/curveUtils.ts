/**
 * Curve関数とユーティリティ
 * Elinのcurve関数を再現し、計算用のヘルパー関数を提供
 */

/** Curveパラメータの型定義 */
export interface CurveParams {
  /** 減衰が始まる閾値 */
  start: number;
  /** 各ステップの幅 */
  step: number;
  /** 減衰率 (0-100) */
  rate: number;
}

/** 計算ステップの情報 */
export interface CurveStep {
  /** ステップ番号 (0-9) */
  stepNumber: number;
  /** このステップの閾値 (start + stepNumber * step) */
  threshold: number;
  /** ステップ開始時の値 */
  inputValue: number;
  /** ステップ終了時の値 */
  outputValue: number;
  /** 減衰が適用されたかどうか */
  applied: boolean;
}

/** 計算結果と過程 */
export interface CurveResult {
  /** 入力値 */
  input: number;
  /** 最終出力値 */
  output: number;
  /** 減衰量 (input - output) */
  reduction: number;
  /** 各ステップの詳細 */
  steps: CurveStep[];
}

/**
 * Elinのcurve関数を再現
 * @param a 入力値
 * @param start 減衰が始まる閾値
 * @param step 各ステップの幅
 * @param rate 減衰率 (0-100)
 * @returns 減衰後の値
 */
export function curve(
  a: number,
  start: number,
  step: number,
  rate: number
): number {
  if (a <= start) {
    return a;
  }

  for (let i = 0; i < 10; i++) {
    const num = start + i * step;
    if (a > num) {
      a = Math.floor(num + ((a - num) * rate) / 100);
      continue;
    }
    return a;
  }
  return a;
}

/**
 * Curveパラメータオブジェクトを使ってcurve関数を呼び出す
 */
export function curveWithParams(a: number, params: CurveParams): number {
  return curve(a, params.start, params.step, params.rate);
}

/**
 * 計算過程を含めたcurve関数
 * @param a 入力値
 * @param params Curveパラメータ
 * @returns 計算結果と各ステップの詳細
 */
export function curveWithSteps(a: number, params: CurveParams): CurveResult {
  const { start, step, rate } = params;
  const steps: CurveStep[] = [];
  const originalInput = a;

  if (a <= start) {
    return {
      input: originalInput,
      output: a,
      reduction: 0,
      steps: [],
    };
  }

  let currentValue = a;

  for (let i = 0; i < 10; i++) {
    const threshold = start + i * step;

    if (currentValue > threshold) {
      const newValue = Math.floor(
        threshold + ((currentValue - threshold) * rate) / 100
      );
      steps.push({
        stepNumber: i,
        threshold,
        inputValue: currentValue,
        outputValue: newValue,
        applied: true,
      });
      currentValue = newValue;
    } else {
      // このステップでは減衰が適用されなかった（最終ステップ）
      steps.push({
        stepNumber: i,
        threshold,
        inputValue: currentValue,
        outputValue: currentValue,
        applied: false,
      });
      break;
    }
  }

  return {
    input: originalInput,
    output: currentValue,
    reduction: originalInput - currentValue,
    steps,
  };
}

/**
 * 範囲内の全ての整数値に対してcurve関数を適用
 * @param params Curveパラメータ
 * @param rangeStart 入力範囲の開始値
 * @param rangeEnd 入力範囲の終了値
 * @returns 各入力値に対する出力値の配列
 */
export function calculateCurveRange(
  params: CurveParams,
  rangeStart: number,
  rangeEnd: number
): Array<{ input: number; output: number; reduction: number }> {
  const results: Array<{ input: number; output: number; reduction: number }> =
    [];

  for (let i = rangeStart; i <= rangeEnd; i++) {
    const output = curveWithParams(i, params);
    results.push({
      input: i,
      output,
      reduction: i - output,
    });
  }

  return results;
}
