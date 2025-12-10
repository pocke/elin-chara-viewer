'use client';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { curveWithParams } from '@/lib/curveUtils';
import type { CurveConfigSet } from './curveSimConfig';

interface CurveGraphProps {
  /** 複数の設定セット */
  configs: CurveConfigSet[];
  /** 入力範囲の開始値 */
  rangeStart: number;
  /** 入力範囲の終了値 */
  rangeEnd: number;
}

/** グラフのマージン設定 */
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

/** ホバー情報の型 */
interface HoveredPoint {
  x: number;
  y: number;
  input: number;
  output: number;
  configName: string;
  color: string;
}

export default function CurveGraph({
  configs,
  rangeStart,
  rangeEnd,
}: CurveGraphProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const lastInputRef = useRef<number | null>(null);

  // グラフのサイズ
  const width = 600;
  const height = 400;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // 各設定のデータポイントを計算（Mapで高速検索可能に）
  const dataPoints = useMemo(() => {
    return configs.map((config) => {
      const points: Array<{ input: number; output: number }> = [];
      const pointMap = new Map<number, number>();
      for (let i = rangeStart; i <= rangeEnd; i++) {
        const output = curveWithParams(i, config.params);
        points.push({ input: i, output });
        pointMap.set(i, output);
      }
      return { config, points, pointMap };
    });
  }, [configs, rangeStart, rangeEnd]);

  // Y軸の最大値を計算（全設定の最大出力値）
  const maxOutput = useMemo(() => {
    let max = rangeEnd;
    dataPoints.forEach(({ points }) => {
      points.forEach((p) => {
        if (p.output > max) max = p.output;
      });
    });
    return max;
  }, [dataPoints, rangeEnd]);

  // スケール関数をメモ化
  const xScale = useMemo(() => {
    return (value: number) =>
      ((value - rangeStart) / (rangeEnd - rangeStart)) * innerWidth;
  }, [rangeStart, rangeEnd, innerWidth]);

  const yScale = useMemo(() => {
    return (value: number) => innerHeight - (value / maxOutput) * innerHeight;
  }, [innerHeight, maxOutput]);

  // パスを生成（メモ化されたスケール関数を使用）
  const generatePath = useMemo(() => {
    return (points: Array<{ input: number; output: number }>) => {
      if (points.length === 0) return '';
      const pathData = points.map((p, i) => {
        const x = xScale(p.input);
        const y = yScale(p.output);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      });
      return pathData.join(' ');
    };
  }, [xScale, yScale]);

  // 線形（減衰なし）のパス
  const linearPath = useMemo(() => {
    const points = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      points.push({ input: i, output: i });
    }
    return generatePath(points);
  }, [rangeStart, rangeEnd, generatePath]);

  // グリッドラインの値を計算
  const xTicks = useMemo(() => {
    const step = Math.ceil((rangeEnd - rangeStart) / 10);
    const ticks = [];
    for (let i = rangeStart; i <= rangeEnd; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] !== rangeEnd) {
      ticks.push(rangeEnd);
    }
    return ticks;
  }, [rangeStart, rangeEnd]);

  const yTicks = useMemo(() => {
    const step = Math.ceil(maxOutput / 10);
    const ticks = [];
    for (let i = 0; i <= maxOutput; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] !== maxOutput) {
      ticks.push(maxOutput);
    }
    return ticks;
  }, [maxOutput]);

  // SVG全体でのマウス移動ハンドラ（最適化版）
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dataPoints.length === 0) return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - MARGIN.left;
      const mouseY = e.clientY - rect.top - MARGIN.top;

      // グラフ領域外なら何もしない
      if (
        mouseX < 0 ||
        mouseX > innerWidth ||
        mouseY < 0 ||
        mouseY > innerHeight
      ) {
        if (hoveredPoint !== null) {
          setHoveredPoint(null);
          lastInputRef.current = null;
        }
        return;
      }

      // マウス位置から入力値を逆算
      const inputValue = Math.round(
        (mouseX / innerWidth) * (rangeEnd - rangeStart) + rangeStart
      );

      // 同じ入力値なら更新しない
      if (inputValue === lastInputRef.current) {
        return;
      }
      lastInputRef.current = inputValue;

      // 範囲内かチェック
      if (inputValue < rangeStart || inputValue > rangeEnd) {
        return;
      }

      // 最初の設定のデータを使用（複数設定の場合も最初のものを表示）
      const { config, pointMap } = dataPoints[0];
      const output = pointMap.get(inputValue);

      if (output !== undefined) {
        setHoveredPoint({
          x: xScale(inputValue) + MARGIN.left,
          y: yScale(output) + MARGIN.top,
          input: inputValue,
          output,
          configName: config.name,
          color: config.color,
        });
      }
    },
    [
      dataPoints,
      innerWidth,
      innerHeight,
      rangeStart,
      rangeEnd,
      xScale,
      yScale,
      hoveredPoint,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    lastInputRef.current = null;
  }, []);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 auto', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 背景 */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={innerWidth}
          height={innerHeight}
          fill={alpha(theme.palette.background.paper, 0.5)}
        />

        {/* グリッドライン - X軸 */}
        {xTicks.map((tick) => (
          <line
            key={`x-${tick}`}
            x1={xScale(tick) + MARGIN.left}
            y1={MARGIN.top}
            x2={xScale(tick) + MARGIN.left}
            y2={MARGIN.top + innerHeight}
            stroke={alpha(theme.palette.divider, 0.3)}
            strokeDasharray="4,4"
          />
        ))}

        {/* グリッドライン - Y軸 */}
        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            x1={MARGIN.left}
            y1={yScale(tick) + MARGIN.top}
            x2={MARGIN.left + innerWidth}
            y2={yScale(tick) + MARGIN.top}
            stroke={alpha(theme.palette.divider, 0.3)}
            strokeDasharray="4,4"
          />
        ))}

        {/* X軸 */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + innerHeight}
          x2={MARGIN.left + innerWidth}
          y2={MARGIN.top + innerHeight}
          stroke={theme.palette.text.primary}
        />

        {/* Y軸 */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + innerHeight}
          stroke={theme.palette.text.primary}
        />

        {/* X軸ラベル */}
        {xTicks.map((tick) => (
          <text
            key={`xlabel-${tick}`}
            x={xScale(tick) + MARGIN.left}
            y={MARGIN.top + innerHeight + 20}
            textAnchor="middle"
            fill={theme.palette.text.secondary}
            fontSize={12}
          >
            {tick}
          </text>
        ))}

        {/* Y軸ラベル */}
        {yTicks.map((tick) => (
          <text
            key={`ylabel-${tick}`}
            x={MARGIN.left - 10}
            y={yScale(tick) + MARGIN.top + 4}
            textAnchor="end"
            fill={theme.palette.text.secondary}
            fontSize={12}
          >
            {tick}
          </text>
        ))}

        {/* X軸タイトル */}
        <text
          x={MARGIN.left + innerWidth / 2}
          y={height - 10}
          textAnchor="middle"
          fill={theme.palette.text.primary}
          fontSize={14}
        >
          {t.curveSim.input}
        </text>

        {/* Y軸タイトル */}
        <text
          x={15}
          y={MARGIN.top + innerHeight / 2}
          textAnchor="middle"
          fill={theme.palette.text.primary}
          fontSize={14}
          transform={`rotate(-90, 15, ${MARGIN.top + innerHeight / 2})`}
        >
          {t.curveSim.output}
        </text>

        {/* 線形ライン（参照線） */}
        <path
          d={linearPath}
          fill="none"
          stroke={alpha(theme.palette.text.secondary, 0.5)}
          strokeWidth={1.5}
          strokeDasharray="8,4"
          transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
        />

        {/* 各設定のライン */}
        {dataPoints.map(({ config, points }) => (
          <path
            key={config.id}
            d={generatePath(points)}
            fill="none"
            stroke={config.color}
            strokeWidth={2.5}
            transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* ホバー時のポイント表示 */}
        {hoveredPoint &&
          (() => {
            const tooltipWidth = 120;
            const tooltipHeight = 50;
            const padding = 10;

            // ツールチップの位置を計算（右端・下端に近い場合は反対側に表示）
            const showOnLeft = hoveredPoint.x + padding + tooltipWidth > width;
            const showAbove = hoveredPoint.y - padding - tooltipHeight < 0;

            const tooltipX = showOnLeft
              ? hoveredPoint.x - padding - tooltipWidth
              : hoveredPoint.x + padding;
            const tooltipY = showAbove
              ? hoveredPoint.y + padding
              : hoveredPoint.y - padding - tooltipHeight;

            return (
              <>
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={6}
                  fill={hoveredPoint.color}
                  stroke={theme.palette.background.paper}
                  strokeWidth={2}
                />
                {/* ツールチップ */}
                <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                  <rect
                    x={0}
                    y={0}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill={alpha(theme.palette.background.paper, 0.95)}
                    stroke={theme.palette.divider}
                    rx={4}
                  />
                  <text
                    x={8}
                    y={16}
                    fill={hoveredPoint.color}
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {hoveredPoint.configName}
                  </text>
                  <text
                    x={8}
                    y={30}
                    fill={theme.palette.text.primary}
                    fontSize={12}
                  >
                    {t.curveSim.input}: {hoveredPoint.input}
                  </text>
                  <text
                    x={8}
                    y={44}
                    fill={theme.palette.text.primary}
                    fontSize={12}
                  >
                    {t.curveSim.output}: {hoveredPoint.output}
                  </text>
                </g>
              </>
            );
          })()}
      </svg>

      {/* 凡例 */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
          mt: 2,
        }}
      >
        {/* 線形ライン凡例 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <svg width={30} height={10}>
            <line
              x1={0}
              y1={5}
              x2={30}
              y2={5}
              stroke={alpha(theme.palette.text.secondary, 0.5)}
              strokeWidth={2}
              strokeDasharray="4,2"
            />
          </svg>
          <Typography variant="body2" color="text.secondary">
            {t.curveSim.linearLine}
          </Typography>
        </Box>

        {/* 各設定の凡例 */}
        {configs.map((config) => (
          <Box
            key={config.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <svg width={30} height={10}>
              <line
                x1={0}
                y1={5}
                x2={30}
                y2={5}
                stroke={config.color}
                strokeWidth={2.5}
              />
            </svg>
            <Typography variant="body2">
              {config.name} (start={config.params.start}, step=
              {config.params.step}, rate={config.params.rate})
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
