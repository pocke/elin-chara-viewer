'use client';

import { Alert, Box, Button } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/simple-i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reset}>
            {t.common.retry}
          </Button>
        }
      >
        {t.common.unexpectedError}
      </Alert>
    </Box>
  );
}
