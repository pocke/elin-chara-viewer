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
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
import { normalizeForSearch } from '@/lib/searchUtils';
import { useTranslation } from '@/lib/simple-i18n';

export interface VersionListEntry {
  version: string;
  slug: string;
  channel: 'stable' | 'nightly';
  date: string;
}

interface VersionsPageClientProps {
  entries: VersionListEntry[];
}

type ChannelFilter = 'all' | VersionListEntry['channel'];

export default function VersionsPageClient({
  entries,
}: VersionsPageClientProps) {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const visibleEntries = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query.trim());

    return entries.filter(
      (entry) =>
        (channelFilter === 'all' || entry.channel === channelFilter) &&
        (!normalizedQuery ||
          normalizeForSearch(entry.version).includes(normalizedQuery) ||
          normalizeForSearch(entry.slug).includes(normalizedQuery))
    );
  }, [entries, query, channelFilter]);

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
              <TableCell>{t.common.version}</TableCell>
              <TableCell>{t.common.releaseDate}</TableCell>
              <TableCell>{t.common.channel}</TableCell>
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
                <TableCell>{entry.date}</TableCell>
                <TableCell>
                  {entry.channel === 'stable'
                    ? t.common.channelStable
                    : t.common.channelNightly}
                </TableCell>
              </TableRow>
            ))}
            {visibleEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
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
