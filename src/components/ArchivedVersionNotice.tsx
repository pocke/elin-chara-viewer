'use client';

import { Alert } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';

export default function ArchivedVersionNotice({
  version,
}: {
  version: string;
}) {
  const { t } = useTranslation();

  return (
    <Alert severity="info" square>
      {t.common.archivedVersionNotice.replace('{{version}}', version)}
    </Alert>
  );
}
