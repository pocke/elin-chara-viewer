'use client';
import { Box, Typography, Collapse, Button } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import { Element } from '@/lib/models/element';

interface ResistanceData {
  value: number;
  element: Element;
}

interface ResistanceBarChartProps {
  resistances: ResistanceData[];
  locale: string;
}

const getResistanceLabel = (value: number): string => {
  if (value <= -10) return '致命的な弱点';
  if (value <= -5) return '弱点';
  if (value === 0) return 'なし';
  if (value >= 20) return '免疫';
  if (value >= 15) return '素晴らしい耐性';
  if (value >= 10) return '強い耐性';
  if (value >= 5) return '耐性';
  return 'なし';
};

export default function ResistanceBarChart({
  resistances,
  locale,
}: ResistanceBarChartProps) {
  const [showZeroResistances, setShowZeroResistances] = useState(false);
  const chartWidth = 600;
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

  // 値を座標に変換する関数
  const valueToX = (value: number) => {
    const range = maxValue - minValue;
    const ratio = (value - minValue) / range;
    return ratio * chartWidth;
  };

  // 0の位置を計算
  const zeroX = valueToX(0);

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        耐性
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* X軸ラベル（上部） */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 120 }} />
          <Box
            sx={{
              width: chartWidth,
              position: 'relative',
              height: 40,
            }}
          >
            {gridValues.map((value) => (
              <Box
                key={value}
                sx={{
                  position: 'absolute',
                  left: valueToX(value),
                  top: 0,
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {value}
                </Typography>
                {value >= -10 && value <= 20 && (
                  <Typography
                    variant="caption"
                    color="text.primary"
                    sx={{ display: 'block', fontWeight: 'bold' }}
                  >
                    {getResistanceLabel(value)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* 0でない耐性のチャートエリア */}
        {nonZeroResistances.map((resistance) => {
          const elementColor = resistance.element.getColor();
          const barWidth = Math.abs(valueToX(resistance.value) - zeroX);
          const isNegative = resistance.value < 0;
          const resistanceLabel = getResistanceLabel(resistance.value);

          return (
            <Box
              key={resistance.element.alias}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                height: rowHeight,
              }}
            >
              {/* 要素名 */}
              <Box
                sx={{
                  width: 120,
                  textAlign: 'right',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  {resistance.element.name(locale)}
                </Typography>
              </Box>

              {/* バーエリア */}
              <Box
                sx={{
                  width: chartWidth,
                  height: 24,
                  position: 'relative',
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                {/* グリッドライン */}
                {gridValues.map((value) => (
                  <Box
                    key={`grid-${value}-${resistance.element.alias}`}
                    sx={{
                      position: 'absolute',
                      left: valueToX(value),
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
                    left: isNegative ? valueToX(resistance.value) : zeroX,
                    top: 2,
                    bottom: 2,
                    width: barWidth,
                    backgroundColor: elementColor + '80',
                    borderRadius: 1,
                    transition: 'width 0.3s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary"
                    sx={{
                      textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                    }}
                  >
                    {resistance.value > 0 ? '+' : ''}
                    {resistance.value}
                  </Typography>
                </Box>
              </Box>

              {/* ラベル */}
              <Box sx={{ minWidth: 100 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 'bold' }}
                >
                  ({resistanceLabel})
                </Typography>
              </Box>
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
              耐性なし ({zeroResistances.length}個)
            </Button>
            <Collapse in={showZeroResistances}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {zeroResistances.map((resistance) => (
                  <Box
                    key={resistance.element.alias}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      height: rowHeight,
                    }}
                  >
                    {/* 要素名 */}
                    <Box
                      sx={{
                        width: 120,
                        textAlign: 'right',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 'normal',
                        }}
                      >
                        {resistance.element.name(locale)}
                      </Typography>
                    </Box>

                    {/* バーエリア */}
                    <Box
                      sx={{
                        width: chartWidth,
                        height: 24,
                        position: 'relative',
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {/* 0線のみ表示 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: zeroX,
                          top: 0,
                          bottom: 0,
                          width: '1px',
                          backgroundColor: 'grey.400',
                          zIndex: 1,
                        }}
                      />

                      {/* 0の表示（線から少しずらす） */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: zeroX + 10,
                          top: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          0
                        </Typography>
                      </Box>
                    </Box>

                    {/* ラベル */}
                    <Box sx={{ minWidth: 100 }}>
                      <Typography variant="caption" color="text.secondary">
                        (なし)
                      </Typography>
                    </Box>
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
