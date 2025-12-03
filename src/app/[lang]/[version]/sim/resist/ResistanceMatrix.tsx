'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { Chara } from '@/lib/models/chara';
import {
  resistanceElements,
  Element,
  elementByAlias,
} from '@/lib/models/element';
import { getContrastColor } from '@/lib/colorUtils';

interface ResistanceMatrixProps {
  charas: Chara[];
  onCellClick?: (rowAlias: string, colAlias: string) => void;
}

interface ResistanceBuckets {
  defect: number; // -10以下
  weakness: number; // -9以上-5以下
  none: number; // -4以上4以下
  normal: number; // 5以上9以下
  strong: number; // 10以上14以下
  superb: number; // 15以上19以下
  immunity: number; // 20以上
}

function getResistanceBucket(value: number): keyof ResistanceBuckets {
  if (value <= -10) return 'defect';
  if (value <= -5) return 'weakness';
  if (value < 5) return 'none';
  if (value < 10) return 'normal';
  if (value < 15) return 'strong';
  if (value < 20) return 'superb';
  return 'immunity';
}

type MatrixMode = 'resistance' | 'weakness';

function formatBucketsForMode(
  buckets: ResistanceBuckets,
  mode: MatrixMode
): React.ReactNode {
  if (mode === 'resistance') {
    // 2行に分ける: 耐性/強い耐性 と 素晴らしい耐性/免疫
    return (
      <>
        {buckets.normal}/{buckets.strong}
        <br />
        {buckets.superb}/{buckets.immunity}
      </>
    );
  } else {
    // 弱点モードは1行のまま
    return `${buckets.defect}/${buckets.weakness}`;
  }
}

export default function ResistanceMatrix({
  charas,
  onCellClick,
}: ResistanceMatrixProps) {
  const { t, language } = useTranslation();
  const resistanceElementsList = resistanceElements();
  const [mode, setMode] = useState<MatrixMode>('resistance');
  const [hoveredCell, setHoveredCell] = useState<{
    row: string;
    col: string;
  } | null>(null);

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: MatrixMode | null
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const handleCellMouseEnter = useCallback(
    (rowAlias: string, colAlias: string) => {
      setHoveredCell({ row: rowAlias, col: colAlias });
    },
    []
  );

  const handleCellMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Build the matrix data
  const matrixData = useMemo(() => {
    // For each pair of resistance elements, count characters in each bucket
    const matrix: Map<string, Map<string, ResistanceBuckets>> = new Map();

    resistanceElementsList.forEach((rowElement) => {
      const rowMap = new Map<string, ResistanceBuckets>();

      resistanceElementsList.forEach((colElement) => {
        const buckets: ResistanceBuckets = {
          defect: 0,
          weakness: 0,
          none: 0,
          normal: 0,
          strong: 0,
          superb: 0,
          immunity: 0,
        };

        charas.forEach((chara) => {
          const rowResist = chara.getElementPower(rowElement.alias);
          const colResist = chara.getElementPower(colElement.alias);
          // Take the minimum of the two resistances
          const minResist = Math.min(rowResist, colResist);
          const bucket = getResistanceBucket(minResist);
          buckets[bucket]++;
        });

        rowMap.set(colElement.alias, buckets);
      });

      matrix.set(rowElement.alias, rowMap);
    });

    return matrix;
  }, [charas, resistanceElementsList]);

  // Get short name for element by converting res* to ele* and getting that element's name
  const getShortName = (element: Element): string => {
    const attackAlias = element.alias.replace(/^res/, 'ele');
    const attackElement = elementByAlias(attackAlias);
    return attackElement
      ? attackElement.name(language)
      : element.name(language);
  };

  const formatDescription =
    mode === 'resistance'
      ? t.resistSim.resistanceFormatDescription
      : t.resistSim.weaknessFormatDescription;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t.resistSim.resistanceMatrix}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.resistSim.resistanceMatrixDescription}
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="resistance">
            {t.resistSim.matrixModeResistance}
          </ToggleButton>
          <ToggleButton value="weakness">
            {t.resistSim.matrixModeWeakness}
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {formatDescription}
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ maxHeight: '80vh', overflow: 'auto' }}
        onMouseLeave={handleCellMouseLeave}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  backgroundColor: 'background.paper',
                  minWidth: 60,
                }}
              />
              {resistanceElementsList.map((element) => {
                const isHighlighted = hoveredCell?.col === element.alias;
                return (
                  <TableCell
                    key={element.alias}
                    align="center"
                    sx={{
                      minWidth: 50,
                      whiteSpace: 'nowrap',
                      backgroundColor: element.getColor(),
                      color: getContrastColor(element.getColor()),
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      transition: 'font-weight 0.1s',
                    }}
                  >
                    {getShortName(element)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {resistanceElementsList.map((rowElement) => {
              const isRowHighlighted = hoveredCell?.row === rowElement.alias;
              return (
                <TableRow key={rowElement.alias}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      backgroundColor: rowElement.getColor(),
                      color: getContrastColor(rowElement.getColor()),
                      whiteSpace: 'nowrap',
                      fontWeight: isRowHighlighted ? 'bold' : 'normal',
                      transition: 'font-weight 0.1s',
                    }}
                  >
                    {getShortName(rowElement)}
                  </TableCell>
                  {resistanceElementsList.map((colElement) => {
                    const buckets = matrixData
                      .get(rowElement.alias)
                      ?.get(colElement.alias);
                    if (!buckets) return null;

                    const formatted = formatBucketsForMode(buckets, mode);
                    const isDiagonal = rowElement.alias === colElement.alias;
                    const isHighlighted =
                      hoveredCell?.row === rowElement.alias ||
                      hoveredCell?.col === colElement.alias;

                    return (
                      <TableCell
                        key={colElement.alias}
                        align="center"
                        onMouseEnter={() =>
                          handleCellMouseEnter(
                            rowElement.alias,
                            colElement.alias
                          )
                        }
                        onClick={() =>
                          onCellClick?.(rowElement.alias, colElement.alias)
                        }
                        sx={{
                          cursor: onCellClick ? 'pointer' : 'default',
                          backgroundColor:
                            isDiagonal || isHighlighted
                              ? (theme) =>
                                  alpha(theme.palette.primary.main, 0.08)
                              : 'inherit',
                          transition: 'background-color 0.1s',
                          lineHeight: 1.2,
                          py: 0.5,
                        }}
                      >
                        {formatted}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
