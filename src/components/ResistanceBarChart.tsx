/**
 * ResistanceBarChart - 耐性データを水平バーチャートで表示するコンポーネント
 *
 * 機能:
 * - 0を中心とした水平バー（正の値は右、負の値は左に延びる）
 * - 要素ごとの色分け（Element.getColor()を使用）
 * - レスポンシブデザイン（スマートフォン対応）
 * - ホバー時に詳細情報をツールチップで表示
 * - X軸ラベルとグリッドライン（5刻み）
 * - 耐性ラベル（"免疫"、"弱点"など）は中型以上の画面でのみ表示
 * - 0の耐性は折りたたみ可能なセクションに分離
 * - X軸ラベルは耐性なしセクションにも表示、全体の耐性がない場合は非表示
 *
 * 耐性ラベル定義:
 * - <= -10: "致命的な弱点" / "Defect"
 * - <= -5: "弱点" / "Weakness"
 * - === 0: "なし" / "None"
 * - >= 20: "免疫" / "Immunity"
 * - >= 15: "素晴らしい耐性" / "Superb"
 * - >= 10: "強い耐性" / "Strong"
 * - >= 5: "耐性" / "Normal"
 *
 * 表示範囲: -15 ～ +25
 * グリッドライン: -15, -10, -5, 0, 5, 10, 15, 20, 25
 */

'use client';
import { Box, Typography, Collapse, Button, Tooltip } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { Element } from '@/lib/models/element';
import { getResistanceLabel } from '@/lib/resistanceUtils';

interface ResistanceData {
  value: number;
  element: Element;
}

interface ResistanceBarChartProps {
  resistances: ResistanceData[];
  locale: string;
}

export default function ResistanceBarChart({
  resistances,
  locale,
}: ResistanceBarChartProps) {
  const { t } = useTranslation();
  const [showZeroResistances, setShowZeroResistances] = useState(false);
  const chartWidth = { xs: 280, sm: 400, md: 600 };
  const rowHeight = 40;

  // 耐性を0でないものと0のものに分ける
  const nonZeroResistances = resistances.filter((r) => r.value !== 0);
  const zeroResistances = resistances.filter((r) => r.value === 0);

  const maxValue = 25;
  const minValue = -15;

  // グリッドラインとラベル用の値を生成
  const gridValues: number[] = [];
  for (let i = minValue; i <= maxValue; i += 5) {
    gridValues.push(i);
  }

  // X軸ラベルのコンポーネント
  const XAxisLabels = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: { xs: 80, sm: 100, md: 120 } }} />
      <Box
        sx={{
          width: chartWidth,
          position: 'relative',
          height: { xs: 50, sm: 45, md: 40 },
        }}
      >
        {gridValues.map((value) => (
          <Box
            key={value}
            sx={{
              position: 'absolute',
              left: `${((value - minValue) / (maxValue - minValue)) * 100}%`,
              top: 0,
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
            >
              {value}
            </Typography>
            {value >= -10 && value <= 20 && (
              <Typography
                variant="caption"
                color="text.primary"
                sx={{
                  display: { xs: 'none', sm: 'none', md: 'block' },
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                {getResistanceLabel(value, t)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {t.common.resistances}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* X軸ラベル（上部） */}
        {nonZeroResistances.length > 0 && <XAxisLabels />}

        {/* 0でない耐性のチャートエリア */}
        {nonZeroResistances.map((resistance) => {
          const elementColor = resistance.element.getColor();
          const isNegative = resistance.value < 0;
          const resistanceLabel = getResistanceLabel(resistance.value, t);

          // パーセンテージベースでバーの位置とサイズを計算
          const valuePercent =
            ((resistance.value - minValue) / (maxValue - minValue)) * 100;
          const zeroPercent = ((0 - minValue) / (maxValue - minValue)) * 100;
          const barWidth = Math.abs(valuePercent - zeroPercent);
          const barLeft = isNegative ? valuePercent : zeroPercent;

          return (
            <Box
              key={resistance.element.alias}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                height: rowHeight,
              }}
            >
              {/* 要素名 */}
              <Box
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  textAlign: 'right',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  {resistance.element.name(locale)}
                </Typography>
              </Box>

              {/* バーエリア */}
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {resistance.element.name(locale)}
                    </Typography>
                    <Typography variant="body2">
                      {resistance.value > 0 ? '+' : ''}
                      {resistance.value} ({resistanceLabel})
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    width: chartWidth,
                    height: 24,
                    position: 'relative',
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {/* グリッドライン */}
                  {gridValues.map((value) => (
                    <Box
                      key={`grid-${value}-${resistance.element.alias}`}
                      sx={{
                        position: 'absolute',
                        left: `${((value - minValue) / (maxValue - minValue)) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: value === 0 ? 'grey.600' : 'grey.300',
                        zIndex: 1,
                      }}
                    />
                  ))}

                  {/* バー */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${barLeft}%`,
                      top: 2,
                      bottom: 2,
                      width: `${barWidth}%`,
                      backgroundColor: elementColor + '80',
                      borderRadius: 1,
                      transition: 'all 0.3s ease-in-out',
                      zIndex: 2,
                      '&:hover': {
                        backgroundColor: elementColor + 'CC',
                      },
                    }}
                  />
                </Box>
              </Tooltip>
            </Box>
          );
        })}

        {/* 0の耐性の折りたたみ表示 */}
        {zeroResistances.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => setShowZeroResistances(!showZeroResistances)}
              startIcon={showZeroResistances ? <ExpandLess /> : <ExpandMore />}
              variant="text"
              size="small"
              sx={{ mb: 1 }}
            >
              {t.common.resistanceNoneCount.replace(
                '{{count}}',
                zeroResistances.length.toString()
              )}
            </Button>
            <Collapse in={showZeroResistances}>
              <XAxisLabels />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {zeroResistances.map((resistance) => (
                  <Box
                    key={resistance.element.alias}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, sm: 2 },
                      height: rowHeight,
                    }}
                  >
                    {/* 要素名 */}
                    <Box
                      sx={{
                        width: { xs: 80, sm: 100, md: 120 },
                        textAlign: 'right',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 'normal',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {resistance.element.name(locale)}
                      </Typography>
                    </Box>

                    {/* バーエリア */}
                    <Tooltip
                      title={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {resistance.element.name(locale)}
                          </Typography>
                          <Typography variant="body2">
                            0 ({getResistanceLabel(0, t)})
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: chartWidth,
                          height: 24,
                          position: 'relative',
                          backgroundColor: 'grey.50',
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                      >
                        {/* 0線のみ表示 */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${((0 - minValue) / (maxValue - minValue)) * 100}%`,
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            backgroundColor: 'grey.400',
                            zIndex: 1,
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
}
