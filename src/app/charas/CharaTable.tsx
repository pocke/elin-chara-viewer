'use client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link as MuiLink, TableSortLabel } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chara, type CharaRow } from '@/lib/chara';

type SortOrder = 'asc' | 'desc';
type SortBy = 'name' | 'id' | 'default';

interface CharaTableProps {
  charas: CharaRow[];
}

export default function CharaTable({ charas: charaRows }: CharaTableProps) {
  const { t, i18n } = useTranslation('common');
  const charas = charaRows.map(row => new Chara(row));
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

  const sortedCharas = [...charas].sort((a, b) => {
    if (sortBy === 'default') {
      const aSort = a.defaultSortKey;
      const bSort = b.defaultSortKey;
      return sortOrder === 'asc' ? aSort - bSort : bSort - aSort;
    }

    let aValue, bValue;
    
    if (sortBy === 'name') {
      aValue = a.normalizedName(i18n.language).toLowerCase();
      bValue = b.normalizedName(i18n.language).toLowerCase();
    } else {
      aValue = a.id;
      bValue = b.id;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortOrder : 'asc'}
                onClick={() => handleSort('name')}
              >
                {t('name')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'id'}
                direction={sortBy === 'id' ? sortOrder : 'asc'}
                onClick={() => handleSort('id')}
              >
                {t('id')}
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCharas.map(chara => (
            <TableRow key={chara.id} hover>
              <TableCell>
                <MuiLink component={Link} href={`/charas/${chara.id}`} underline="hover">
                  {chara.normalizedName(i18n.language)}
                </MuiLink>
              </TableCell>
              <TableCell>{chara.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
