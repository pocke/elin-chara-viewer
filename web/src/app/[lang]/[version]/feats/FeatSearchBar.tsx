'use client';
import { Box, TextField, Paper } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useState, useCallback, useEffect } from 'react';

interface FeatSearchBarProps {
  initialSearchQuery?: string;
  onSearchChange: (search: string) => void;
}

export default function FeatSearchBar({
  initialSearchQuery = '',
  onSearchChange,
}: FeatSearchBarProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t.common.name}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            ),
          }}
        />
      </Box>
    </Paper>
  );
}
