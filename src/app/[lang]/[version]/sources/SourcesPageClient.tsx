'use client';

import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Storage as StorageIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { GameVersion } from '@/lib/db';
import dynamic from 'next/dynamic';

const SqlRoomContainer = dynamic(() => import('./SqlRoomContainer'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

interface SourcesPageClientProps {
  version: GameVersion;
  tableNames: string[];
  csvBasePath: string;
}

export default function SourcesPageClient({
  version,
  tableNames,
  csvBasePath,
}: SourcesPageClientProps) {
  const { t } = useTranslation();

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <StorageIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.sources.title}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          {t.sources.description}
        </Alert>

        <Paper elevation={1} sx={{ p: 2, height: '70vh' }}>
          <SqlRoomContainer
            key={`${version}-${csvBasePath}`}
            version={version}
            tableNames={tableNames}
            csvBasePath={csvBasePath}
          />
        </Paper>
      </Box>
    </Container>
  );
}
