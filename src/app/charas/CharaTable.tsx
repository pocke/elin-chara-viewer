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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chara } from '@/lib/models/chara';
import { resistanceElements, elementByAlias } from '@/lib/models/element';

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
  | 'feats'
  | 'abilities'
  | string
  | 'default';

interface CharaTableProps {
  charas: Chara[];
}

export default function CharaTable({ charas }: CharaTableProps) {
  const { t, i18n } = useTranslation('common');
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

  const sortedCharas = [...charas].sort((a, b) => {
    if (sortBy === 'default') {
      const aSort = a.defaultSortKey;
      const bSort = b.defaultSortKey;
      return sortOrder === 'asc' ? aSort - bSort : bSort - aSort;
    }

    let aValue: string | number, bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.normalizedName(i18n.language).toLowerCase();
        bValue = b.normalizedName(i18n.language).toLowerCase();
        break;
      case 'race':
        aValue = a.race.name(i18n.language);
        bValue = b.race.name(i18n.language);
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
      case 'feats':
        aValue = a.feats().length;
        bValue = b.feats().length;
        break;
      case 'abilities':
        aValue = a.abilities().length;
        bValue = b.abilities().length;
        break;
      default:
        // Check if it's a resistance sort
        if (sortBy.startsWith('res')) {
          aValue = a.getElementPower(sortBy);
          bValue = b.getElementPower(sortBy);
        } else {
          aValue = a.normalizedName(i18n.language).toLowerCase();
          bValue = b.normalizedName(i18n.language).toLowerCase();
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
                active={sortBy === 'race'}
                direction={sortBy === 'race' ? sortOrder : 'asc'}
                onClick={() => handleSort('race')}
              >
                {t('race')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'level'}
                direction={sortBy === 'level' ? sortOrder : 'asc'}
                onClick={() => handleSort('level')}
              >
                {t('level')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'geneSlot'}
                direction={sortBy === 'geneSlot' ? sortOrder : 'asc'}
                onClick={() => handleSort('geneSlot')}
              >
                {t('geneSlot')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'life'}
                direction={sortBy === 'life' ? sortOrder : 'asc'}
                onClick={() => handleSort('life')}
              >
                {t('life')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'mana'}
                direction={sortBy === 'mana' ? sortOrder : 'asc'}
                onClick={() => handleSort('mana')}
              >
                {t('mana')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'speed'}
                direction={sortBy === 'speed' ? sortOrder : 'asc'}
                onClick={() => handleSort('speed')}
              >
                {t('speed')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'vigor'}
                direction={sortBy === 'vigor' ? sortOrder : 'asc'}
                onClick={() => handleSort('vigor')}
              >
                {t('vigor')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'dv'}
                direction={sortBy === 'dv' ? sortOrder : 'asc'}
                onClick={() => handleSort('dv')}
              >
                {t('dv')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'pv'}
                direction={sortBy === 'pv' ? sortOrder : 'asc'}
                onClick={() => handleSort('pv')}
              >
                {t('pv')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'pdr'}
                direction={sortBy === 'pdr' ? sortOrder : 'asc'}
                onClick={() => handleSort('pdr')}
              >
                {t('pdr')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'edr'}
                direction={sortBy === 'edr' ? sortOrder : 'asc'}
                onClick={() => handleSort('edr')}
              >
                {t('edr')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'ep'}
                direction={sortBy === 'ep' ? sortOrder : 'asc'}
                onClick={() => handleSort('ep')}
              >
                {t('ep')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'bodyParts'}
                direction={sortBy === 'bodyParts' ? sortOrder : 'asc'}
                onClick={() => handleSort('bodyParts')}
              >
                {t('bodyParts')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'feats'}
                direction={sortBy === 'feats' ? sortOrder : 'asc'}
                onClick={() => handleSort('feats')}
              >
                {t('feats')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'abilities'}
                direction={sortBy === 'abilities' ? sortOrder : 'asc'}
                onClick={() => handleSort('abilities')}
              >
                {t('abilities')}
              </TableSortLabel>
            </TableCell>
            {resistanceElementsList.map((resElement) => (
              <TableCell key={resElement.alias}>
                <TableSortLabel
                  active={sortBy === resElement.alias}
                  direction={sortBy === resElement.alias ? sortOrder : 'asc'}
                  onClick={() => handleSort(resElement.alias)}
                >
                  {resElement.name(i18n.language)}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCharas.map((chara) => {
            const [actualGeneSlot, originalGeneSlot] = chara.geneSlot();
            const resistances = chara.resistances();
            const resistanceMap = new Map(
              resistances.map((r) => [r.element.alias, r.power])
            );
            const bodyParts = chara.bodyParts();
            const totalParts = chara.totalBodyParts();
            const feats = chara.feats();
            const abilities = chara.abilities();

            return (
              <TableRow key={chara.id} hover>
                <TableCell>
                  <MuiLink
                    component={Link}
                    href={`/charas/${chara.id}`}
                    underline="hover"
                  >
                    {chara.normalizedName(i18n.language)}
                  </MuiLink>
                </TableCell>
                <TableCell>{chara.race.name(i18n.language)}</TableCell>
                <TableCell>{Math.round(chara.level() * 100) / 100}</TableCell>
                <TableCell>
                  {actualGeneSlot !== originalGeneSlot
                    ? `${actualGeneSlot} (${originalGeneSlot})`
                    : actualGeneSlot}
                </TableCell>
                <TableCell>{chara.life()}</TableCell>
                <TableCell>{chara.mana()}</TableCell>
                <TableCell>{chara.speed()}</TableCell>
                <TableCell>{chara.vigor()}</TableCell>
                <TableCell>{chara.dv()}</TableCell>
                <TableCell>{chara.pv()}</TableCell>
                <TableCell>{chara.pdr()}</TableCell>
                <TableCell>{chara.edr()}</TableCell>
                <TableCell>{chara.ep()}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <div>
                        {Object.entries(bodyParts).map(([part, count]) => (
                          <div key={part}>
                            {t(part)}: {count}
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
                <TableCell>
                  <Tooltip
                    title={
                      <div style={{ maxWidth: 300 }}>
                        {feats.length === 0 ? (
                          <div>なし</div>
                        ) : (
                          feats.map((feat, index) => (
                            <div key={index}>
                              {feat.element.name(i18n.language)}
                              {feat.power !== 1 ? ` (${feat.power})` : ''}
                            </div>
                          ))
                        )}
                      </div>
                    }
                    arrow
                    placement="top"
                  >
                    <span style={{ cursor: 'help' }}>{feats.length}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <div style={{ maxWidth: 300 }}>
                        {abilities.length === 0 ? (
                          <div>なし</div>
                        ) : (
                          abilities.map((ability, index) => {
                            const baseElement = elementByAlias(ability.name);
                            const elementElement = ability.element
                              ? (elementByAlias(ability.element) ?? null)
                              : null;

                            let abilityName: string;
                            if (baseElement) {
                              abilityName = baseElement.abilityName(
                                elementElement,
                                i18n.language
                              );
                            } else {
                              abilityName = ability.name;
                            }

                            return (
                              <div key={index}>
                                {abilityName}
                                {ability.party ? ` (${t('range')})` : ''}
                              </div>
                            );
                          })
                        )}
                      </div>
                    }
                    arrow
                    placement="top"
                  >
                    <span style={{ cursor: 'help' }}>{abilities.length}</span>
                  </Tooltip>
                </TableCell>
                {resistanceElementsList.map((resElement) => {
                  const resValue = resistanceMap.get(resElement.alias) || 0;
                  const displayValue =
                    resValue > 0
                      ? `+${resValue}${resValue >= 200 ? ' (免疫)' : ''}`
                      : resValue < 0
                        ? `${resValue}`
                        : '';
                  return (
                    <TableCell key={resElement.alias}>{displayValue}</TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
