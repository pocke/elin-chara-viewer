'use client';

import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
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

export default function VersionsPageClient({
  entries,
}: VersionsPageClientProps) {
  const { t, language } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t.common.pastVersionsTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t.common.pastVersionsDescription}
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t.common.version}</TableCell>
              <TableCell>{t.common.releaseDate}</TableCell>
              <TableCell>{t.common.channel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
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
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
