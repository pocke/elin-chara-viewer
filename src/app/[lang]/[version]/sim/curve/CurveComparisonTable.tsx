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
import { type CurveConfigSet, calculateCurveRange } from '@/lib/curveUtils';

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

  // テーブル用のステップ値を計算（10刻み、または範囲が小さい場合は1刻み）
  const stepSize = useMemo(() => {
    const range = rangeEnd - rangeStart;
    if (range <= 20) return 1;
    if (range <= 50) return 5;
    return 10;
  }, [rangeStart, rangeEnd]);

  // テーブルの行データを生成
  const tableData = useMemo(() => {
    const rows: Array<{
      input: number;
      results: Array<{ output: number; reduction: number }>;
    }> = [];

    for (let i = rangeStart; i <= rangeEnd; i += stepSize) {
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

    // 最後の値が含まれていない場合は追加
    if (rows.length > 0 && rows[rows.length - 1].input !== rangeEnd) {
      const results = configs.map((config) => {
        const rangeData = calculateCurveRange(
          config.params,
          rangeEnd,
          rangeEnd
        );
        return rangeData[0];
      });
      rows.push({
        input: rangeEnd,
        results: results.map((r) => ({
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
