'use client';

import {
  Box,
  Container,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
import RelativeDate from '@/components/RelativeDate';
import { AddedChara } from '@/lib/history/types';
import { normalizeForSearch } from '@/lib/searchUtils';
import { compareVersionNames } from '@/lib/versionOrder';
import { useTranslation } from '@/lib/simple-i18n';

export interface VersionListEntry {
  version: string;
  slug: string;
  channel: 'stable' | 'nightly';
  date: string;
  added: AddedChara[];
}

interface VersionsPageClientProps {
  entries: VersionListEntry[];
}

type ChannelFilter = 'all' | VersionListEntry['channel'];
type SortKey = 'version' | 'date' | 'channel' | 'added';
type SortDirection = 'asc' | 'desc';

const compareText = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const compareBy: Record<
  SortKey,
  (a: VersionListEntry, b: VersionListEntry) => number
> = {
  version: (a, b) => compareVersionNames(a.version, b.version),
  date: (a, b) =>
    compareText(a.date, b.date) || compareVersionNames(a.version, b.version),
  channel: (a, b) =>
    compareText(a.channel, b.channel) ||
    compareVersionNames(a.version, b.version),
  added: (a, b) =>
    a.added.length - b.added.length ||
    compareVersionNames(a.version, b.version),
};

const COLUMNS: SortKey[] = ['version', 'date', 'channel', 'added'];

export default function VersionsPageClient({
  entries,
}: VersionsPageClientProps) {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('version');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const columnLabels: Record<SortKey, string> = {
    version: t.common.version,
    date: t.common.releaseDate,
    channel: t.common.channel,
    added: t.common.newCharacters,
  };

  const visibleEntries = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query.trim());

    const filtered = entries.filter(
      (entry) =>
        (channelFilter === 'all' || entry.channel === channelFilter) &&
        (!normalizedQuery ||
          normalizeForSearch(entry.version).includes(normalizedQuery) ||
          normalizeForSearch(entry.slug).includes(normalizedQuery))
    );

    const sign = sortDirection === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => sign * compareBy[sortKey](a, b));
  }, [entries, query, channelFilter, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t.common.pastVersionsTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t.common.pastVersionsDescription}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label={t.common.version}
            placeholder={t.common.versionSearchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label={t.common.channel}
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">{t.common.channelAll}</MenuItem>
            <MenuItem value="stable">{t.common.channelStable}</MenuItem>
            <MenuItem value="nightly">{t.common.channelNightly}</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {COLUMNS.map((key) => (
                <TableCell
                  key={key}
                  sortDirection={sortKey === key ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortKey === key}
                    direction={sortKey === key ? sortDirection : 'desc'}
                    onClick={() => handleSort(key)}
                  >
                    {columnLabels[key]}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleEntries.map((entry) => (
              <TableRow key={entry.slug} hover>
                <TableCell>
                  <Link href={`/${language}/${entry.slug}/charas`}>
                    {entry.version}
                  </Link>
                </TableCell>
                <TableCell>
                  <RelativeDate date={entry.date} />
                </TableCell>
                <TableCell>
                  {entry.channel === 'stable'
                    ? t.common.channelStable
                    : t.common.channelNightly}
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: 1,
                      rowGap: 0.5,
                    }}
                  >
                    {entry.added.map((chara) => (
                      <Link
                        key={chara.key}
                        href={`/${language}/${entry.slug}/charas/${encodeURIComponent(chara.key)}`}
                      >
                        {chara[language]}
                      </Link>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {visibleEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    role="status"
                  >
                    {t.common.noVersionsMatched}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
