'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link as MuiLink,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { useState, useMemo, forwardRef } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import { TableVirtuoso } from 'react-virtuoso';
import { Chara } from '@/lib/models/chara';
import { resistanceElements } from '@/lib/models/element';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';

type SortOrder = 'asc' | 'desc';
type SortBy =
  | 'name'
  | 'race'
  | 'level'
  | 'geneSlot'
  | 'life'
  | 'mana'
  | 'speed'
  | 'vigor'
  | 'dv'
  | 'pv'
  | 'pdr'
  | 'edr'
  | 'ep'
  | 'bodyParts'
  | string
  | 'default';

interface VirtualizedCharaTableProps {
  charas: Chara[];
  showStatusColumns: boolean;
  showResistances: boolean;
}

// Table components for react-virtuoso
const VirtuosoScroller = forwardRef<HTMLDivElement>((props, ref) => (
  <TableContainer component={Paper} {...props} ref={ref} />
));
VirtuosoScroller.displayName = 'VirtuosoScroller';

const VirtuosoTableBody = forwardRef<HTMLTableSectionElement>((props, ref) => (
  <TableBody {...props} ref={ref} />
));
VirtuosoTableBody.displayName = 'VirtuosoTableBody';

const VirtuosoTableComponents = {
  Scroller: VirtuosoScroller,
  Table: (props: React.ComponentProps<typeof Table>) => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead: (props: React.ComponentProps<typeof TableHead>) => (
    <TableHead
      {...props}
      sx={{
        backgroundColor: 'background.paper',
        zIndex: 10,
        position: 'sticky',
        top: 0,
      }}
    />
  ),
  TableRow: ({ ...props }: React.ComponentProps<typeof TableRow>) => (
    <TableRow {...props} />
  ),
  TableBody: VirtuosoTableBody,
};

export default function VirtualizedCharaTable({
  charas,
  showStatusColumns,
  showResistances,
}: VirtualizedCharaTableProps) {
  const { t, language } = useTranslation();

  const params = useParams();
  const lang = params.lang as string;
  const resistanceElementsList = resistanceElements();
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedCharas = useMemo(() => {
    return [...charas].sort((a, b) => {
      if (sortBy === 'default') {
        const aSort = a.defaultSortKey;
        const bSort = b.defaultSortKey;
        return sortOrder === 'asc' ? aSort - bSort : bSort - aSort;
      }

      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.normalizedName(language).toLowerCase();
          bValue = b.normalizedName(language).toLowerCase();
          break;
        case 'race':
          aValue = a.race.name(language);
          bValue = b.race.name(language);
          break;
        case 'level':
          aValue = a.level();
          bValue = b.level();
          break;
        case 'geneSlot':
          aValue = a.geneSlot()[0];
          bValue = b.geneSlot()[0];
          break;
        case 'life':
          aValue = a.life();
          bValue = b.life();
          break;
        case 'mana':
          aValue = a.mana();
          bValue = b.mana();
          break;
        case 'speed':
          aValue = a.speed();
          bValue = b.speed();
          break;
        case 'vigor':
          aValue = a.vigor();
          bValue = b.vigor();
          break;
        case 'dv':
          aValue = a.dv();
          bValue = b.dv();
          break;
        case 'pv':
          aValue = a.pv();
          bValue = b.pv();
          break;
        case 'pdr':
          aValue = a.pdr();
          bValue = b.pdr();
          break;
        case 'edr':
          aValue = a.edr();
          bValue = b.edr();
          break;
        case 'ep':
          aValue = a.ep();
          bValue = b.ep();
          break;
        case 'bodyParts':
          aValue = a.totalBodyParts();
          bValue = b.totalBodyParts();
          break;
        default:
          // Check if it's a resistance sort
          if (sortBy.startsWith('res')) {
            aValue = a.getElementPower(sortBy);
            bValue = b.getElementPower(sortBy);
          } else {
            aValue = a.normalizedName(language).toLowerCase();
            bValue = b.normalizedName(language).toLowerCase();
          }
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [charas, sortBy, sortOrder, language]);

  // Row renderer for virtualization
  const rowContent = (_index: number, chara: Chara) => {
    const [actualGeneSlot, originalGeneSlot] = chara.geneSlot();
    const bodyParts = chara.bodyParts();
    const totalParts = chara.totalBodyParts();

    return (
      <>
        {/* Always visible columns */}
        <TableCell sx={{ width: 200 }}>
          <MuiLink
            component={Link}
            href={`/${lang}/charas/${chara.id}`}
            underline="hover"
          >
            {chara.normalizedName(language)}
          </MuiLink>
        </TableCell>
        <TableCell sx={{ width: 120 }}>{chara.race.name(language)}</TableCell>
        <TableCell sx={{ width: 80 }}>
          {Math.round(chara.level() * 100) / 100}
        </TableCell>
        <TableCell sx={{ width: 100 }}>
          {actualGeneSlot !== originalGeneSlot
            ? `${actualGeneSlot} (${originalGeneSlot})`
            : actualGeneSlot}
        </TableCell>
        {/* Body Parts moved right after Gene Slot */}
        <TableCell sx={{ width: 80 }}>
          <Tooltip
            title={
              <div>
                {Object.entries(bodyParts).map(([part, count]) => (
                  <div key={part}>
                    {t.common[part as keyof typeof t.common]}: {count}
                  </div>
                ))}
              </div>
            }
            arrow
            placement="top"
          >
            <span style={{ cursor: 'help' }}>{totalParts}</span>
          </Tooltip>
        </TableCell>
        {/* Status columns - conditionally shown */}
        {showStatusColumns && (
          <>
            <TableCell sx={{ width: 80 }}>{chara.life()}</TableCell>
            <TableCell sx={{ width: 80 }}>{chara.mana()}</TableCell>
            <TableCell sx={{ width: 80 }}>{chara.speed()}</TableCell>
            <TableCell sx={{ width: 80 }}>{chara.vigor()}</TableCell>
            <TableCell sx={{ width: 60 }}>{chara.dv()}</TableCell>
            <TableCell sx={{ width: 60 }}>{chara.pv()}</TableCell>
            <TableCell sx={{ width: 60 }}>{chara.pdr()}</TableCell>
            <TableCell sx={{ width: 60 }}>{chara.edr()}</TableCell>
            <TableCell sx={{ width: 60 }}>{chara.ep()}</TableCell>
          </>
        )}
        {/* Resistances - conditionally shown */}
        {showResistances &&
          resistanceElementsList.map((resElement) => {
            const resValue = chara.getElementPower(resElement.alias) || 0;
            const displayValue = getResistanceDisplayValueCompact(resValue);
            return (
              <TableCell key={resElement.alias} sx={{ width: 80 }}>
                {displayValue}
              </TableCell>
            );
          })}
      </>
    );
  };

  return (
    <Paper elevation={1} sx={{ height: '70vh', overflow: 'hidden' }}>
      <TableVirtuoso
        data={sortedCharas}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() => (
          <TableRow>
            {/* Always visible columns */}
            <TableCell sx={{ width: 200 }}>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortOrder : 'asc'}
                onClick={() => handleSort('name')}
              >
                {t.common.name}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ width: 120 }}>
              <TableSortLabel
                active={sortBy === 'race'}
                direction={sortBy === 'race' ? sortOrder : 'asc'}
                onClick={() => handleSort('race')}
              >
                {t.common.race}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ width: 80 }}>
              <TableSortLabel
                active={sortBy === 'level'}
                direction={sortBy === 'level' ? sortOrder : 'asc'}
                onClick={() => handleSort('level')}
              >
                {t.common.level}
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ width: 100 }}>
              <Tooltip title={t.common.geneSlot} arrow placement="top">
                <TableSortLabel
                  active={sortBy === 'geneSlot'}
                  direction={sortBy === 'geneSlot' ? sortOrder : 'asc'}
                  onClick={() => handleSort('geneSlot')}
                >
                  {t.common.geneSlotShort}
                </TableSortLabel>
              </Tooltip>
            </TableCell>
            {/* Body Parts moved right after Gene Slot */}
            <TableCell sx={{ width: 80 }}>
              <TableSortLabel
                active={sortBy === 'bodyParts'}
                direction={sortBy === 'bodyParts' ? sortOrder : 'asc'}
                onClick={() => handleSort('bodyParts')}
              >
                {t.common.bodyParts}
              </TableSortLabel>
            </TableCell>
            {/* Status columns - conditionally shown */}
            {showStatusColumns && (
              <>
                <TableCell sx={{ width: 80 }}>
                  <TableSortLabel
                    active={sortBy === 'life'}
                    direction={sortBy === 'life' ? sortOrder : 'asc'}
                    onClick={() => handleSort('life')}
                  >
                    {t.common.life}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 80 }}>
                  <TableSortLabel
                    active={sortBy === 'mana'}
                    direction={sortBy === 'mana' ? sortOrder : 'asc'}
                    onClick={() => handleSort('mana')}
                  >
                    {t.common.mana}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 80 }}>
                  <TableSortLabel
                    active={sortBy === 'speed'}
                    direction={sortBy === 'speed' ? sortOrder : 'asc'}
                    onClick={() => handleSort('speed')}
                  >
                    {t.common.speed}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 80 }}>
                  <TableSortLabel
                    active={sortBy === 'vigor'}
                    direction={sortBy === 'vigor' ? sortOrder : 'asc'}
                    onClick={() => handleSort('vigor')}
                  >
                    {t.common.vigor}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <TableSortLabel
                    active={sortBy === 'dv'}
                    direction={sortBy === 'dv' ? sortOrder : 'asc'}
                    onClick={() => handleSort('dv')}
                  >
                    {t.common.dv}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <TableSortLabel
                    active={sortBy === 'pv'}
                    direction={sortBy === 'pv' ? sortOrder : 'asc'}
                    onClick={() => handleSort('pv')}
                  >
                    {t.common.pv}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <Tooltip title={t.common.pdr} arrow placement="top">
                    <TableSortLabel
                      active={sortBy === 'pdr'}
                      direction={sortBy === 'pdr' ? sortOrder : 'asc'}
                      onClick={() => handleSort('pdr')}
                    >
                      {t.common.pdrShort}
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <Tooltip title={t.common.edr} arrow placement="top">
                    <TableSortLabel
                      active={sortBy === 'edr'}
                      direction={sortBy === 'edr' ? sortOrder : 'asc'}
                      onClick={() => handleSort('edr')}
                    >
                      {t.common.edrShort}
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <Tooltip title={t.common.ep} arrow placement="top">
                    <TableSortLabel
                      active={sortBy === 'ep'}
                      direction={sortBy === 'ep' ? sortOrder : 'asc'}
                      onClick={() => handleSort('ep')}
                    >
                      {t.common.epShort}
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
              </>
            )}
            {/* Resistances - conditionally shown */}
            {showResistances &&
              resistanceElementsList.map((resElement) => (
                <TableCell key={resElement.alias} sx={{ width: 80 }}>
                  <TableSortLabel
                    active={sortBy === resElement.alias}
                    direction={sortBy === resElement.alias ? sortOrder : 'asc'}
                    onClick={() => handleSort(resElement.alias)}
                  >
                    {resElement.name(language)}
                  </TableSortLabel>
                </TableCell>
              ))}
          </TableRow>
        )}
        itemContent={rowContent}
      />
    </Paper>
  );
}
