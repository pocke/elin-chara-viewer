'use client';
import {
  Box,
  TextField,
  Autocomplete,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useState, useCallback } from 'react';

interface CharaSearchBarProps {
  raceOptions: string[];
  jobOptions: string[];
  featOptions: Array<[string, string]>;
  abilityOptions: Array<[string, string]>;
  onSearchChange: (search: string) => void;
  onRaceChange: (races: string[]) => void;
  onJobChange: (jobs: string[]) => void;
  onFeatChange: (feats: string[]) => void;
  onAbilityChange: (abilities: string[]) => void;
}

export default function CharaSearchBar({
  raceOptions,
  jobOptions,
  featOptions,
  abilityOptions,
  onSearchChange,
  onRaceChange,
  onJobChange,
  onFeatChange,
  onAbilityChange,
}: CharaSearchBarProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const handleRaceChange = useCallback(
    (newRaces: string[]) => {
      setSelectedRaces(newRaces);
      onRaceChange(newRaces);
    },
    [onRaceChange]
  );

  const handleJobChange = useCallback(
    (newJobs: string[]) => {
      setSelectedJobs(newJobs);
      onJobChange(newJobs);
    },
    [onJobChange]
  );

  const handleFeatChange = useCallback(
    (newFeats: string[]) => {
      setSelectedFeats(newFeats);
      onFeatChange(newFeats);
    },
    [onFeatChange]
  );

  const handleAbilityChange = useCallback(
    (newAbilities: string[]) => {
      setSelectedAbilities(newAbilities);
      onAbilityChange(newAbilities);
    },
    [onAbilityChange]
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRaces([]);
    setSelectedJobs([]);
    setSelectedFeats([]);
    setSelectedAbilities([]);
    onSearchChange('');
    onRaceChange([]);
    onJobChange([]);
    onFeatChange([]);
    onAbilityChange([]);
  }, [
    onSearchChange,
    onRaceChange,
    onJobChange,
    onFeatChange,
    onAbilityChange,
  ]);

  const hasActiveFilters =
    searchQuery ||
    selectedRaces.length > 0 ||
    selectedJobs.length > 0 ||
    selectedFeats.length > 0 ||
    selectedAbilities.length > 0;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h2">
          {t.common.filters}
        </Typography>
        {hasActiveFilters && (
          <Chip
            label={t.common.clearFilters}
            onClick={clearAllFilters}
            variant="outlined"
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>

      {/* PC幅では1行に並べる、モバイルでは縦積み */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'stretch', lg: 'flex-start' },
        }}
      >
        {/* 全体検索 */}
        <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t.common.searchCharacters}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />
        </Box>

        {/* 種族選択 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Autocomplete
            multiple
            value={selectedRaces}
            onChange={(_, newValue) => handleRaceChange(newValue)}
            options={raceOptions}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t.common.race}
                size="small"
              />
            )}
          />
        </Box>

        {/* 職業選択 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Autocomplete
            multiple
            value={selectedJobs}
            onChange={(_, newValue) => handleJobChange(newValue)}
            options={jobOptions}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t.common.job}
                size="small"
              />
            )}
          />
        </Box>

        {/* フィート選択 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Autocomplete
            multiple
            value={selectedFeats}
            onChange={(_, newValue) => handleFeatChange(newValue)}
            options={featOptions.map(([, name]) => name)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t.common.feats}
                size="small"
              />
            )}
          />
        </Box>

        {/* アビリティ選択 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Autocomplete
            multiple
            value={selectedAbilities}
            onChange={(_, newValue) => handleAbilityChange(newValue)}
            options={abilityOptions.map(([, name]) => name)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t.common.abilities}
                size="small"
              />
            )}
          />
        </Box>
      </Box>
    </Paper>
  );
}
