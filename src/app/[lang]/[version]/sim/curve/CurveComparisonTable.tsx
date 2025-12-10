'use client';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { calculateCurveRange } from '@/lib/curveUtils';
import type { CurveConfigSet } from './curveSimConfig';

interface CurveComparisonTableProps {
  /** 設定セット */
  configs: CurveConfigSet[];
  /** 入力範囲の開始値 */
  rangeStart: number;
  /** 入力範囲の終了値 */
  rangeEnd: number;
}

export default function CurveComparisonTable({
  configs,
  rangeStart,
  rangeEnd,
}: CurveComparisonTableProps) {
  const { t } = useTranslation();

  // テーブルの最大行数
  const MAX_ROWS = 100;

  // テーブル用のステップ値を計算（範囲に応じてサンプリング）
  const stepSize = useMemo(() => {
    const range = rangeEnd - rangeStart;
    if (range <= 20) return 1;
    if (range <= 50) return 5;
    if (range <= 100) return 10;
    // 大きな範囲の場合は最大行数に収まるようにサンプリング
    return Math.ceil(range / MAX_ROWS);
  }, [rangeStart, rangeEnd]);

  // テーブルの行データを生成（両端は必ず含める）
  const tableData = useMemo(() => {
    const rows: Array<{
      input: number;
      results: Array<{ output: number; reduction: number }>;
    }> = [];

    // 開始値を追加
    const startResults = configs.map((config) => {
      const rangeData = calculateCurveRange(
        config.params,
        rangeStart,
        rangeStart
      );
      return rangeData[0];
    });
    rows.push({
      input: rangeStart,
      results: startResults.map((r) => ({
        output: r.output,
        reduction: r.reduction,
      })),
    });

    // 中間値をサンプリング（開始・終了を除く）
    const firstStep = Math.ceil(rangeStart / stepSize) * stepSize;
    const startValue =
      firstStep <= rangeStart ? firstStep + stepSize : firstStep;

    for (let i = startValue; i < rangeEnd; i += stepSize) {
      const results = configs.map((config) => {
        const rangeData = calculateCurveRange(config.params, i, i);
        return rangeData[0];
      });
      rows.push({
        input: i,
        results: results.map((r) => ({
          output: r.output,
          reduction: r.reduction,
        })),
      });
    }

    // 終了値を追加（開始と同じでない場合）
    if (rangeEnd !== rangeStart) {
      const endResults = configs.map((config) => {
        const rangeData = calculateCurveRange(
          config.params,
          rangeEnd,
          rangeEnd
        );
        return rangeData[0];
      });
      rows.push({
        input: rangeEnd,
        results: endResults.map((r) => ({
          output: r.output,
          reduction: r.reduction,
        })),
      });
    }

    return rows;
  }, [configs, rangeStart, rangeEnd, stepSize]);

  if (configs.length === 0) {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t.curveSim.table}
      </Typography>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t.curveSim.input}</TableCell>
              {configs.map((config) => (
                <TableCell key={config.id} align="right">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: config.color }}
                    >
                      {config.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.curveSim.output} / {t.curveSim.reduction}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.input} hover>
                <TableCell component="th" scope="row">
                  {row.input}
                </TableCell>
                {row.results.map((result, index) => (
                  <TableCell key={configs[index].id} align="right">
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontWeight: 'medium' }}
                    >
                      {result.output}
                    </Typography>
                    {result.reduction > 0 && (
                      <Typography
                        variant="caption"
                        component="span"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        (-{result.reduction})
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
