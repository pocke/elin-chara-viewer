'use client';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { useMemo, useState } from 'react';
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

export default function CurveGraph({
  configs,
  rangeStart,
  rangeEnd,
}: CurveGraphProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    input: number;
    output: number;
    configName: string;
    color: string;
  } | null>(null);

  // グラフのサイズ
  const width = 600;
  const height = 400;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // 各設定のデータポイントを計算
  const dataPoints = useMemo(() => {
    return configs.map((config) => {
      const points: Array<{ input: number; output: number }> = [];
      for (let i = rangeStart; i <= rangeEnd; i++) {
        const output = curveWithParams(i, config.params);
        points.push({ input: i, output });
      }
      return { config, points };
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

  // マウスイベントハンドラ
  const handleMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    config: CurveConfigSet,
    points: Array<{ input: number; output: number }>
  ) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - MARGIN.left;

    // マウス位置から入力値を逆算
    const inputValue = Math.round(
      (mouseX / innerWidth) * (rangeEnd - rangeStart) + rangeStart
    );

    // 範囲内かチェック
    if (inputValue >= rangeStart && inputValue <= rangeEnd) {
      const point = points.find((p) => p.input === inputValue);
      if (point) {
        setHoveredPoint({
          x: xScale(point.input) + MARGIN.left,
          y: yScale(point.output) + MARGIN.top,
          input: point.input,
          output: point.output,
          configName: config.name,
          color: config.color,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
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
          <g key={config.id}>
            <path
              d={generatePath(points)}
              fill="none"
              stroke={config.color}
              strokeWidth={2.5}
              transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
            />
            {/* インタラクション用の透明な太い線 */}
            <path
              d={generatePath(points)}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
              style={{ cursor: 'crosshair' }}
              onMouseMove={(e) =>
                handleMouseMove(
                  e as unknown as React.MouseEvent<SVGSVGElement>,
                  config,
                  points
                )
              }
            />
          </g>
        ))}

        {/* ホバー時のポイント表示 */}
        {hoveredPoint && (
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
            <g
              transform={`translate(${hoveredPoint.x + 10}, ${hoveredPoint.y - 10})`}
            >
              <rect
                x={0}
                y={-20}
                width={120}
                height={50}
                fill={alpha(theme.palette.background.paper, 0.95)}
                stroke={theme.palette.divider}
                rx={4}
              />
              <text
                x={8}
                y={-4}
                fill={hoveredPoint.color}
                fontSize={12}
                fontWeight="bold"
              >
                {hoveredPoint.configName}
              </text>
              <text
                x={8}
                y={14}
                fill={theme.palette.text.primary}
                fontSize={12}
              >
                {t.curveSim.input}: {hoveredPoint.input}
              </text>
              <text
                x={8}
                y={28}
                fill={theme.palette.text.primary}
                fontSize={12}
              >
                {t.curveSim.output}: {hoveredPoint.output}
              </text>
            </g>
          </>
        )}
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
