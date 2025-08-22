'use client';
import {
  Container,
  Typography,
  Box,
  TextField,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { type CharaRow, Chara } from '@/lib/models/chara';
import { elementByAlias } from '@/lib/models/element';
import VirtualizedCharaTable from './VirtualizedCharaTable';

interface CharaPageClientProps {
  charaRows: CharaRow[];
}

export default function CharaPageClient({ charaRows }: CharaPageClientProps) {
  const charas = useMemo(
    () => charaRows.map((row) => new Chara(row)),
    [charaRows]
  );
  const { t, language } = useTranslation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isClient, setIsClient] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [featSearch, setFeatSearch] = useState('');
  const [abilitySearch, setAbilitySearch] = useState('');

  // Column visibility state - simplified to groups only
  const [showStatusColumns, setShowStatusColumns] = useState(true);
  const [showResistances, setShowResistances] = useState(false);

  // Menu state for column visibility
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const isColumnMenuOpen = Boolean(columnMenuAnchorEl);

  // Ensure client-side rendering for i18n consistency
  useEffect(() => {
    setIsClient(true);

    // On mobile devices, hide status columns by default to save space
    if (isMobile) {
      setShowStatusColumns(false);
    }
  }, [isMobile]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Expand characters with variants (memoized for performance)
  const allCharas = useMemo(() => {
    return charas.flatMap((chara) => {
      const variants = chara.variants();
      return variants.length > 0 ? variants : [chara];
    });
  }, [charas]);

  // Pre-normalize character names for better search performance
  const normalizedCharaNames = useMemo(() => {
    return new Map(
      allCharas.map((chara) => [
        chara.id,
        chara.normalizedName(language).toLowerCase(),
      ])
    );
  }, [allCharas, language]);

  // Get unique body parts, feats, and abilities from all characters
  const availableOptions = useMemo(() => {
    // Return empty options during server-side rendering to avoid hydration mismatch
    if (!isClient) {
      return {
        bodyParts: [],
        feats: [],
        abilities: [],
      };
    }

    const bodyPartsSet = new Set<string>();
    const featsMap = new Map<string, string>();
    const abilitiesMap = new Map<string, string>();

    allCharas.forEach((chara) => {
      // Body parts
      Object.entries(chara.bodyParts()).forEach(([part, count]) => {
        if (count > 0) bodyPartsSet.add(part);
      });

      // Feats
      chara.feats().forEach((feat) => {
        featsMap.set(feat.element.alias, feat.element.name(language));
      });

      // Abilities
      chara.abilities().forEach((ability) => {
        const baseElement = elementByAlias(ability.name);
        const elementElement = ability.element
          ? (elementByAlias(ability.element) ?? null)
          : null;

        let abilityName: string;
        if (baseElement) {
          abilityName = baseElement.abilityName(elementElement, language);
        } else {
          abilityName = ability.name;
        }
        abilitiesMap.set(ability.name, abilityName);
      });
    });

    return {
      bodyParts: Array.from(bodyPartsSet).sort(),
      feats: Array.from(featsMap.entries()).sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
      abilities: Array.from(abilitiesMap.entries()).sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
    };
  }, [allCharas, language, isClient]);

  // Filter characters based on search and filters (optimized)
  const filteredCharas = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase();

    return allCharas.filter((chara) => {
      // Name search - use pre-normalized names for better performance
      if (searchLower) {
        const normalizedName = normalizedCharaNames.get(chara.id);
        if (!normalizedName || !normalizedName.includes(searchLower)) {
          return false;
        }
      }

      // Body parts filter
      if (selectedBodyParts.length > 0) {
        const charaParts = chara.bodyParts();
        const hasAllSelectedParts = selectedBodyParts.every(
          (part) => charaParts[part as keyof typeof charaParts] > 0
        );
        if (!hasAllSelectedParts) return false;
      }

      // Feats filter
      if (selectedFeats.length > 0) {
        const charaFeats = chara.feats().map((feat) => feat.element.alias);
        const hasAllSelectedFeats = selectedFeats.every((feat) =>
          charaFeats.includes(feat)
        );
        if (!hasAllSelectedFeats) return false;
      }

      // Abilities filter
      if (selectedAbilities.length > 0) {
        const charaAbilities = chara.abilities().map((ability) => ability.name);
        const hasAllSelectedAbilities = selectedAbilities.every((ability) =>
          charaAbilities.includes(ability)
        );
        if (!hasAllSelectedAbilities) return false;
      }

      return true;
    });
  }, [
    allCharas,
    debouncedSearchQuery,
    selectedBodyParts,
    selectedFeats,
    selectedAbilities,
    normalizedCharaNames,
  ]);

  const handleBodyPartToggle = useCallback((part: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  }, []);

  const handleFeatToggle = useCallback((feat: string) => {
    setSelectedFeats((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  }, []);

  const handleAbilityToggle = useCallback((ability: string) => {
    setSelectedAbilities((prev) =>
      prev.includes(ability)
        ? prev.filter((a) => a !== ability)
        : [...prev, ability]
    );
  }, []);

  // Column visibility handlers - simplified
  const handleStatusColumnsToggle = useCallback(() => {
    setShowStatusColumns((prev) => !prev);
  }, []);

  const handleResistancesToggle = useCallback(() => {
    setShowResistances((prev) => !prev);
  }, []);

  // Menu handlers
  const handleColumnMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setColumnMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleColumnMenuClose = useCallback(() => {
    setColumnMenuAnchorEl(null);
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.common.allCharacters}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t.common.charactersCount.replace(
            '{{count}}',
            filteredCharas.length.toString()
          )}{' '}
          / {allCharas.length}
        </Typography>

        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t.common.searchCharacters}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{t.common.filters}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t.common.bodyParts}
                  </Typography>
                  <FormGroup>
                    {availableOptions.bodyParts.map((part) => (
                      <FormControlLabel
                        key={part}
                        control={
                          <Checkbox
                            checked={selectedBodyParts.includes(part)}
                            onChange={() => handleBodyPartToggle(part)}
                          />
                        }
                        label={t.common[part as keyof typeof t.common]}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t.common.feats}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder={t.common.searchFeats}
                    value={featSearch}
                    onChange={(e) => setFeatSearch(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <FormGroup>
                      {availableOptions.feats
                        .filter(([, name]) =>
                          name.toLowerCase().includes(featSearch.toLowerCase())
                        )
                        .map(([alias, name]) => (
                          <FormControlLabel
                            key={alias}
                            control={
                              <Checkbox
                                checked={selectedFeats.includes(alias)}
                                onChange={() => handleFeatToggle(alias)}
                              />
                            }
                            label={name}
                          />
                        ))}
                    </FormGroup>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t.common.abilities}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder={t.common.searchAbilities}
                    value={abilitySearch}
                    onChange={(e) => setAbilitySearch(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <FormGroup>
                      {availableOptions.abilities
                        .filter(([, name]) =>
                          name
                            .toLowerCase()
                            .includes(abilitySearch.toLowerCase())
                        )
                        .map(([alias, name]) => (
                          <FormControlLabel
                            key={alias}
                            control={
                              <Checkbox
                                checked={selectedAbilities.includes(alias)}
                                onChange={() => handleAbilityToggle(alias)}
                              />
                            }
                            label={name}
                          />
                        ))}
                    </FormGroup>
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Column visibility controls */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={handleColumnMenuOpen}
            aria-controls={isColumnMenuOpen ? 'column-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isColumnMenuOpen ? 'true' : undefined}
          >
            {t.common.columnVisibility}
          </Button>
          <Menu
            id="column-menu"
            anchorEl={columnMenuAnchorEl}
            open={isColumnMenuOpen}
            onClose={handleColumnMenuClose}
          >
            <MenuItem onClick={handleStatusColumnsToggle}>
              <Checkbox
                checked={showStatusColumns}
                onChange={handleStatusColumnsToggle}
                size="small"
                sx={{ mr: 1 }}
              />
              {t.common.statusColumns}
            </MenuItem>
            <MenuItem onClick={handleResistancesToggle}>
              <Checkbox
                checked={showResistances}
                onChange={handleResistancesToggle}
                size="small"
                sx={{ mr: 1 }}
              />
              {t.common.resistances}
            </MenuItem>
          </Menu>
        </Box>

        <VirtualizedCharaTable
          charas={filteredCharas}
          showStatusColumns={showStatusColumns}
          showResistances={showResistances}
        />
      </Box>
    </Container>
  );
}
