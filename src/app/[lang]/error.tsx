'use client';

import { Alert, Box, Button } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';

export default function Error({ reset }: { reset: () => void }) {
  const { t } = useTranslation();

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
