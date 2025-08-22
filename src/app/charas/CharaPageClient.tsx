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
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { type CharaRow, Chara } from '@/lib/models/chara';
import { elementByAlias } from '@/lib/models/element';
import CharaTable from './CharaTable';

interface CharaPageClientProps {
  charaRows: CharaRow[];
}

export default function CharaPageClient({ charaRows }: CharaPageClientProps) {
  const charas = charaRows.map((row) => new Chara(row));
  const { t, i18n } = useTranslation('common');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [featSearch, setFeatSearch] = useState('');
  const [abilitySearch, setAbilitySearch] = useState('');

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
        chara.normalizedName(i18n.language).toLowerCase(),
      ])
    );
  }, [allCharas, i18n.language]);

  // Get unique body parts, feats, and abilities from all characters
  const availableOptions = useMemo(() => {
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
        featsMap.set(feat.element.alias, feat.element.name(i18n.language));
      });

      // Abilities
      chara.abilities().forEach((ability) => {
        const baseElement = elementByAlias(ability.name);
        const elementElement = ability.element
          ? (elementByAlias(ability.element) ?? null)
          : null;

        let abilityName: string;
        if (baseElement) {
          abilityName = baseElement.abilityName(elementElement, i18n.language);
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
  }, [allCharas, i18n.language]);

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
        const hasSelectedPart = selectedBodyParts.some(
          (part) => charaParts[part as keyof typeof charaParts] > 0
        );
        if (!hasSelectedPart) return false;
      }

      // Feats filter
      if (selectedFeats.length > 0) {
        const charaFeats = chara.feats().map((feat) => feat.element.alias);
        const hasSelectedFeat = selectedFeats.some((feat) =>
          charaFeats.includes(feat)
        );
        if (!hasSelectedFeat) return false;
      }

      // Abilities filter
      if (selectedAbilities.length > 0) {
        const charaAbilities = chara.abilities().map((ability) => ability.name);
        const hasSelectedAbility = selectedAbilities.some((ability) =>
          charaAbilities.includes(ability)
        );
        if (!hasSelectedAbility) return false;
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t('allCharacters')}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('charactersCount', { count: filteredCharas.length })} /{' '}
          {allCharas.length}
        </Typography>

        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('searchCharacters')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{t('filters')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('bodyParts')}
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
                        label={t(part)}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('feats')}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder={t('searchFeats')}
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
                    {t('abilities')}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder={t('searchAbilities')}
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

        <CharaTable charas={filteredCharas} />
      </Box>
    </Container>
  );
}
