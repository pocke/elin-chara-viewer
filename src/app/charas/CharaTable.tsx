'use client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link as MuiLink, TableSortLabel } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { normalizedCharaName, type Chara } from '@/lib/chara';

type SortOrder = 'asc' | 'desc';
type SortBy = 'name' | 'id' | 'default';

interface CharaTableProps {
  charas: Chara[];
}

export default function CharaTable({ charas }: CharaTableProps) {
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
      const aSort = a.__meta.defaultSortKey;
      const bSort = b.__meta.defaultSortKey;
      return sortOrder === 'asc' ? aSort - bSort : bSort - aSort;
    }

    let aValue, bValue;
    
    if (sortBy === 'name') {
      aValue = normalizedCharaName(a).toLowerCase();
      bValue = normalizedCharaName(b).toLowerCase();
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
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'id'}
                direction={sortBy === 'id' ? sortOrder : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCharas.map(chara => (
            <TableRow key={chara.id} hover>
              <TableCell>
                <MuiLink component={Link} href={`/charas/${chara.id}`} underline="hover">
                  {normalizedCharaName(chara)}
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