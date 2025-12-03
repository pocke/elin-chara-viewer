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
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { Chara } from '@/lib/models/chara';
import {
  resistanceElements,
  Element,
  elementByAlias,
} from '@/lib/models/element';

interface ResistanceMatrixProps {
  charas: Chara[];
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
): string {
  if (mode === 'resistance') {
    // 5以上10未満/10以上15未満/15以上20未満/20以上
    return `${buckets.normal}/${buckets.strong}/${buckets.superb}/${buckets.immunity}`;
  } else {
    // -10以下/-9以上-5以下
    return `${buckets.defect}/${buckets.weakness}`;
  }
}

export default function ResistanceMatrix({ charas }: ResistanceMatrixProps) {
  const { t, language } = useTranslation();
  const resistanceElementsList = resistanceElements();
  const [mode, setMode] = useState<MatrixMode>('resistance');

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: MatrixMode | null
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

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
              {resistanceElementsList.map((element) => (
                <TableCell
                  key={element.alias}
                  align="center"
                  sx={{
                    minWidth: mode === 'resistance' ? 80 : 60,
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    backgroundColor: element.getColor(),
                    color: getContrastColor(element.getColor()),
                  }}
                >
                  {getShortName(element)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {resistanceElementsList.map((rowElement) => (
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
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
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
                  const total = charas.length;

                  const tooltipContent = (
                    <Box>
                      <Typography variant="caption" display="block">
                        {getShortName(rowElement)} × {getShortName(colElement)}
                      </Typography>
                      {mode === 'resistance' ? (
                        <>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceNormal}: {buckets.normal} (
                            {((buckets.normal / total) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceStrong}: {buckets.strong} (
                            {((buckets.strong / total) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceSuperb}: {buckets.superb} (
                            {((buckets.superb / total) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceImmunity}: {buckets.immunity} (
                            {((buckets.immunity / total) * 100).toFixed(1)}%)
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceDefect}: {buckets.defect} (
                            {((buckets.defect / total) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="caption" display="block">
                            {t.common.resistanceWeakness}: {buckets.weakness} (
                            {((buckets.weakness / total) * 100).toFixed(1)}%)
                          </Typography>
                        </>
                      )}
                    </Box>
                  );

                  return (
                    <Tooltip
                      key={colElement.alias}
                      title={tooltipContent}
                      arrow
                    >
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap',
                          cursor: 'help',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        {formatted}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Helper function to get contrasting text color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}
