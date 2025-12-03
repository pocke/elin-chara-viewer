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
} from '@mui/material';
import { useMemo } from 'react';
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
  veryWeak: number; // -5以下
  weak: number; // -4以上5未満
  normal: number; // 5以上10未満
  strong: number; // 10以上15未満
  veryStrong: number; // 15以上20未満
  immune: number; // 20以上
}

function getResistanceBucket(value: number): keyof ResistanceBuckets {
  if (value <= -5) return 'veryWeak';
  if (value < 5) return 'weak';
  if (value < 10) return 'normal';
  if (value < 15) return 'strong';
  if (value < 20) return 'veryStrong';
  return 'immune';
}

function formatBuckets(buckets: ResistanceBuckets): string {
  return `${buckets.veryWeak}/${buckets.weak}/${buckets.normal}/${buckets.strong}/${buckets.veryStrong}/${buckets.immune}`;
}

export default function ResistanceMatrix({ charas }: ResistanceMatrixProps) {
  const { t, language } = useTranslation();
  const resistanceElementsList = resistanceElements();

  // Build the matrix data
  const matrixData = useMemo(() => {
    // For each pair of resistance elements, count characters in each bucket
    const matrix: Map<string, Map<string, ResistanceBuckets>> = new Map();

    resistanceElementsList.forEach((rowElement) => {
      const rowMap = new Map<string, ResistanceBuckets>();

      resistanceElementsList.forEach((colElement) => {
        const buckets: ResistanceBuckets = {
          veryWeak: 0,
          weak: 0,
          normal: 0,
          strong: 0,
          veryStrong: 0,
          immune: 0,
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
    const attackElement = elementByAlias(attackAlias)!;
    return attackElement.name(language);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t.resistSim.resistanceMatrix}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.resistSim.resistanceMatrixDescription}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 2, display: 'block' }}
      >
        {t.resistSim.resistanceMatrixFormat}
      </Typography>

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
                    minWidth: 100,
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

                  const formatted = formatBuckets(buckets);
                  const total = charas.length;
                  const tooltipContent = (
                    <Box>
                      <Typography variant="caption" display="block">
                        {rowElement.name(language)} ×{' '}
                        {colElement.name(language)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        -5以下: {buckets.veryWeak} (
                        {((buckets.veryWeak / total) * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" display="block">
                        -4〜4: {buckets.weak} (
                        {((buckets.weak / total) * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" display="block">
                        5〜9: {buckets.normal} (
                        {((buckets.normal / total) * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" display="block">
                        10〜14: {buckets.strong} (
                        {((buckets.strong / total) * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" display="block">
                        15〜19: {buckets.veryStrong} (
                        {((buckets.veryStrong / total) * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" display="block">
                        20以上: {buckets.immune} (
                        {((buckets.immune / total) * 100).toFixed(1)}%)
                      </Typography>
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
                          fontSize: '0.65rem',
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
