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
import { useState, useCallback, useEffect, useMemo } from 'react';
import { normalizeForSearch } from '@/lib/searchUtils';

interface SearchOption {
  key: string;
  displayName: string;
  nameJa: string;
  nameEn: string;
}

interface CharaSearchBarProps {
  raceOptions: SearchOption[];
  jobOptions: SearchOption[];
  featOptions: SearchOption[];
  abilityOptions: SearchOption[];
  otherOptions: SearchOption[];
  initialSearchQuery?: string;
  initialSelectedRaces?: string[];
  initialSelectedJobs?: string[];
  initialSelectedFeats?: string[];
  initialSelectedAbilities?: string[];
  initialSelectedOthers?: string[];
  initialShowHiddenCharas?: boolean;
  onSearchChange: (search: string) => void;
  onRaceChange: (races: string[]) => void;
  onJobChange: (jobs: string[]) => void;
  onFeatChange: (feats: string[]) => void;
  onAbilityChange: (abilities: string[]) => void;
  onOtherChange: (others: string[]) => void;
  onClearAllFilters: () => void;
}

export default function CharaSearchBar({
  raceOptions,
  jobOptions,
  featOptions,
  abilityOptions,
  otherOptions,
  initialSearchQuery = '',
  initialSelectedRaces = [],
  initialSelectedJobs = [],
  initialSelectedFeats = [],
  initialSelectedAbilities = [],
  initialSelectedOthers = [],
  initialShowHiddenCharas = false,
  onSearchChange,
  onRaceChange,
  onJobChange,
  onFeatChange,
  onAbilityChange,
  onOtherChange,
  onClearAllFilters,
}: CharaSearchBarProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedRaces, setSelectedRaces] =
    useState<string[]>(initialSelectedRaces);
  const [selectedJobs, setSelectedJobs] =
    useState<string[]>(initialSelectedJobs);
  const [selectedFeats, setSelectedFeats] =
    useState<string[]>(initialSelectedFeats);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>(
    initialSelectedAbilities
  );
  const [selectedOthers, setSelectedOthers] = useState<string[]>(
    initialSelectedOthers
  );

  // Update state when initial values change (for when URL changes)
  // This effect synchronizes external state (URL params) with component state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with external URL state
    setSearchQuery(initialSearchQuery);
    setSelectedRaces(initialSelectedRaces);
    setSelectedJobs(initialSelectedJobs);
    setSelectedFeats(initialSelectedFeats);
    setSelectedAbilities(initialSelectedAbilities);
    setSelectedOthers(initialSelectedOthers);
  }, [
    initialSearchQuery,
    initialSelectedRaces,
    initialSelectedJobs,
    initialSelectedFeats,
    initialSelectedAbilities,
    initialSelectedOthers,
    initialShowHiddenCharas,
  ]);

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

  const handleOtherChange = useCallback(
    (newOthers: string[]) => {
      setSelectedOthers(newOthers);
      onOtherChange(newOthers);
    },
    [onOtherChange]
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRaces([]);
    setSelectedJobs([]);
    setSelectedFeats([]);
    setSelectedAbilities([]);
    setSelectedOthers([]);
    onClearAllFilters();
  }, [onClearAllFilters]);

  // Custom filter function that searches both Japanese and English names
  // with hiragana/katakana normalization
  const createBilingualFilter = useCallback((options: SearchOption[]) => {
    return (
      optionKeys: string[],
      { inputValue }: { inputValue: string }
    ): string[] => {
      const normalizedInput = normalizeForSearch(inputValue);
      if (!normalizedInput) return optionKeys;

      return optionKeys.filter((key) => {
        const option = options.find((opt) => opt.key === key);
        if (!option) return false;
        const normalizedJa = normalizeForSearch(option.nameJa);
        const normalizedEn = normalizeForSearch(option.nameEn);
        return (
          normalizedJa.includes(normalizedInput) ||
          normalizedEn.includes(normalizedInput)
        );
      });
    };
  }, []);

  const raceFilter = useMemo(
    () => createBilingualFilter(raceOptions),
    [createBilingualFilter, raceOptions]
  );
  const jobFilter = useMemo(
    () => createBilingualFilter(jobOptions),
    [createBilingualFilter, jobOptions]
  );
  const featFilter = useMemo(
    () => createBilingualFilter(featOptions),
    [createBilingualFilter, featOptions]
  );
  const abilityFilter = useMemo(
    () => createBilingualFilter(abilityOptions),
    [createBilingualFilter, abilityOptions]
  );
  const otherFilter = useMemo(
    () => createBilingualFilter(otherOptions),
    [createBilingualFilter, otherOptions]
  );

  const hasActiveFilters =
    searchQuery ||
    selectedRaces.length > 0 ||
    selectedJobs.length > 0 ||
    selectedFeats.length > 0 ||
    selectedAbilities.length > 0 ||
    selectedOthers.length > 0 ||
    initialShowHiddenCharas;

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
            options={raceOptions.map((opt) => opt.key)}
            filterOptions={raceFilter}
            getOptionLabel={(option) => {
              const raceOption = raceOptions.find((opt) => opt.key === option);
              return raceOption ? raceOption.displayName : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const raceOption = raceOptions.find(
                  (opt) => opt.key === option
                );
                const label = raceOption ? raceOption.displayName : option;
                return (
                  <Chip
                    variant="outlined"
                    label={label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                );
              })
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
            options={jobOptions.map((opt) => opt.key)}
            filterOptions={jobFilter}
            getOptionLabel={(option) => {
              const jobOption = jobOptions.find((opt) => opt.key === option);
              return jobOption ? jobOption.displayName : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const jobOption = jobOptions.find((opt) => opt.key === option);
                const label = jobOption ? jobOption.displayName : option;
                return (
                  <Chip
                    variant="outlined"
                    label={label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                );
              })
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
            options={featOptions.map((opt) => opt.key)}
            filterOptions={featFilter}
            getOptionLabel={(option) => {
              const featOption = featOptions.find((opt) => opt.key === option);
              return featOption ? featOption.displayName : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const featOption = featOptions.find(
                  (opt) => opt.key === option
                );
                const label = featOption ? featOption.displayName : option;
                return (
                  <Chip
                    variant="outlined"
                    label={label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                );
              })
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
            options={abilityOptions.map((opt) => opt.key)}
            filterOptions={abilityFilter}
            getOptionLabel={(option) => {
              const abilityOption = abilityOptions.find(
                (opt) => opt.key === option
              );
              return abilityOption ? abilityOption.displayName : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const abilityOption = abilityOptions.find(
                  (opt) => opt.key === option
                );
                const label = abilityOption
                  ? abilityOption.displayName
                  : option;
                return (
                  <Chip
                    variant="outlined"
                    label={label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                );
              })
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

        {/* その他の属性選択 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Autocomplete
            multiple
            value={selectedOthers}
            onChange={(_, newValue) => handleOtherChange(newValue)}
            options={otherOptions.map((opt) => opt.key)}
            filterOptions={otherFilter}
            getOptionLabel={(option) => {
              const otherOption = otherOptions.find(
                (opt) => opt.key === option
              );
              return otherOption ? otherOption.displayName : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const otherOption = otherOptions.find(
                  (opt) => opt.key === option
                );
                const label = otherOption ? otherOption.displayName : option;
                return (
                  <Chip
                    variant="outlined"
                    label={label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t.common.otherElements}
                size="small"
              />
            )}
          />
        </Box>
      </Box>
    </Paper>
  );
}
