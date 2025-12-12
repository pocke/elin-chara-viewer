'use client';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import {
  Link as MuiLink,
  Tooltip,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Link from 'next/link';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Chara } from '@/lib/models/chara';
import { GameVersion } from '@/lib/db';
import { resistanceElements, elementByAlias } from '@/lib/models/element';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';
import CharaSearchBar from './CharaSearchBar';
import { normalizeForSearch } from '@/lib/searchUtils';

interface DataGridCharaTableProps {
  charas: Chara[];
  version: GameVersion;
}

// Primary attribute aliases
const PRIMARY_ATTRIBUTE_ALIASES = [
  'STR',
  'END',
  'DEX',
  'PER',
  'LER',
  'WIL',
  'MAG',
  'CHA',
];

// Tactics column fields
const TACTICS_FIELDS = [
  'tacticsName',
  'tacticsDistance',
  'tacticsMoveFrequency',
];

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <GridToolbarQuickFilter debounceMs={500} />
    </GridToolbarContainer>
  );
}

const abilityToSearchKey = (ability: {
  name: string;
  element: string | null;
  party: boolean;
}) => {
  return `${ability.name}:${ability.element ?? ''}:${ability.party}`;
};

export default function DataGridCharaTable({
  charas,
  version,
}: DataGridCharaTableProps) {
  const { t, language } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params.lang as string;
  const resistanceElementsList = resistanceElements(version);

  // Resistance element aliases
  const resistanceAliases = useMemo(
    () => resistanceElementsList.map((e) => e.alias),
    [resistanceElementsList]
  );

  // Column presets
  type PresetType = 'all' | 'primaryAttributes' | 'resistances' | 'tactics';

  // Column visibility state
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('all');
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});

  const handleColumnVisibilityModelChange = useCallback(
    (newModel: GridColumnVisibilityModel) => {
      setColumnVisibilityModel(newModel);
    },
    []
  );

  // Custom filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [showHiddenCharas, setShowHiddenCharas] = useState(false);

  // Initialize state from URL parameters
  // This effect synchronizes external state (URL params) with component state
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const races = searchParams.get('races')?.split(',').filter(Boolean) || [];
    const jobs = searchParams.get('jobs')?.split(',').filter(Boolean) || [];
    const feats = searchParams.get('feats')?.split(',').filter(Boolean) || [];
    const abilities =
      searchParams.get('abilities')?.split(',').filter(Boolean) || [];
    const hidden = searchParams.get('hidden') === 'true';

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with external URL state
    setSearchQuery(query);
    setSelectedRaces(races);
    setSelectedJobs(jobs);
    setSelectedFeats(feats);
    setSelectedAbilities(abilities);
    setShowHiddenCharas(hidden);
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(
    (
      query: string,
      races: string[],
      jobs: string[],
      feats: string[],
      abilities: string[],
      hidden: boolean
    ) => {
      const urlSearchParams = new URLSearchParams();

      if (query) {
        urlSearchParams.set('q', query);
      }
      if (races.length > 0) {
        urlSearchParams.set('races', races.join(','));
      }
      if (jobs.length > 0) {
        urlSearchParams.set('jobs', jobs.join(','));
      }
      if (feats.length > 0) {
        urlSearchParams.set('feats', feats.join(','));
      }
      if (abilities.length > 0) {
        urlSearchParams.set('abilities', abilities.join(','));
      }
      if (hidden) {
        urlSearchParams.set('hidden', 'true');
      }

      const newUrl = urlSearchParams.toString()
        ? `/${lang}/${version}/charas?${urlSearchParams.toString()}`
        : `/${lang}/${version}/charas`;

      router.replace(newUrl, { scroll: false });
    },
    [lang, version, router]
  );

  // Convert Chara objects to DataGrid rows
  // Get unique race, job, feat, and ability options for select filters
  const { raceOptions, jobOptions, featOptions, abilityOptions } =
    useMemo(() => {
      const raceMap = new Map<string, string>();
      const jobMap = new Map<string, string>();
      const featMap = new Map<string, string>();
      const abilityMap = new Map<string, string>();

      charas.forEach((chara) => {
        raceMap.set(chara.race.id, chara.race.name(language));
        jobMap.set(chara.job().id, chara.job().name(language));

        // Feats
        chara.feats().forEach((feat) => {
          featMap.set(feat.element.alias, feat.element.name(language));
        });

        // Abilities
        chara.abilities().forEach((ability) => {
          const baseElement = elementByAlias(version, ability.name);
          const elementElement = ability.element
            ? (elementByAlias(version, ability.element) ?? null)
            : null;

          let baseAbilityName: string;
          if (baseElement) {
            baseAbilityName = baseElement.abilityName(elementElement, language);
          } else {
            baseAbilityName = ability.name;
          }

          const key = abilityToSearchKey(ability);

          // Add party variant only if this ability actually has party: true
          if (ability.party) {
            const partyAbilityName = `${baseAbilityName} (${t.common.range})`;
            abilityMap.set(key, partyAbilityName);
          } else {
            abilityMap.set(key, baseAbilityName);
          }
        });
      });

      return {
        raceOptions: Array.from(raceMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
        jobOptions: Array.from(jobMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
        featOptions: Array.from(featMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
        abilityOptions: Array.from(abilityMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
      };
    }, [charas, language, t.common.range, version]);

  // Apply custom filters to charas
  const filteredCharas = useMemo(() => {
    return charas.filter((chara) => {
      // Search query filter (search both Japanese and English names)
      if (searchQuery) {
        const normalizedQuery = normalizeForSearch(searchQuery);
        const nameJa = normalizeForSearch(chara.normalizedName('ja'));
        const nameEn = normalizeForSearch(chara.normalizedName('en'));
        if (
          !nameJa.includes(normalizedQuery) &&
          !nameEn.includes(normalizedQuery)
        ) {
          return false;
        }
      }

      // Race filter
      if (selectedRaces.length > 0) {
        const charaRace = chara.race.id;
        if (!selectedRaces.includes(charaRace)) {
          return false;
        }
      }

      // Job filter
      if (selectedJobs.length > 0) {
        const charaJob = chara.job().id;
        if (!selectedJobs.includes(charaJob)) {
          return false;
        }
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
        const charaAbilities = chara.abilities();
        const hasAllSelectedAbilities = selectedAbilities.every(
          (selectedAbility) => {
            return charaAbilities.some((ability) => {
              return abilityToSearchKey(ability) === selectedAbility;
            });
          }
        );
        if (!hasAllSelectedAbilities) return false;
      }

      // Hidden characters filter
      if (!showHiddenCharas && chara.isHidden()) {
        return false;
      }

      return true;
    });
  }, [
    charas,
    searchQuery,
    selectedRaces,
    selectedJobs,
    selectedFeats,
    selectedAbilities,
    showHiddenCharas,
  ]);

  const rows: GridRowsProp = useMemo(() => {
    return filteredCharas.map((chara) => {
      const [actualGeneSlot, originalGeneSlot] = chara.geneSlot();
      const bodyParts = chara.bodyParts();
      const totalParts = chara.totalBodyParts();

      const row: Record<string, unknown> = {
        id: chara.id,
        name: chara.normalizedName(language),
        race: chara.race.name(language),
        job: chara.job().name(language),
        mainElement: chara.mainElement?.name(language) ?? '',
        level: Math.round(chara.level() * 100) / 100,
        geneSlotValue: actualGeneSlot,
        geneSlot:
          actualGeneSlot !== originalGeneSlot
            ? `${actualGeneSlot} (${originalGeneSlot})`
            : actualGeneSlot,
        bodyParts: totalParts,
        bodyPartsTooltip: Object.entries(bodyParts)
          .map(
            ([part, count]) =>
              `${t.common[part as keyof typeof t.common]}: ${count}`
          )
          .join('\n'),
      };

      // Add status columns
      row.life = chara.life();
      row.mana = chara.mana();
      row.speed = chara.speed();
      row.vigor = chara.vigor();
      row.dv = chara.dv();
      row.pv = chara.pv();

      // Add primary attributes
      chara.primaryAttributes().forEach((attr) => {
        row[attr.alias] = attr.value;
      });

      row.pdr = chara.pdr();
      row.edr = chara.edr();
      row.ep = chara.ep();

      // Add tactics columns
      row.tacticsName = chara.tactics().name(language);
      row.tacticsDistance = chara.tacticsDistance();
      row.tacticsMoveFrequency = chara.tacticsMoveFrequency();

      // Add resistance columns
      resistanceElementsList.forEach((resElement) => {
        const resValue = chara.getElementPower(resElement.alias) || 0;
        row[resElement.alias] = resValue; // Store numeric value for sorting
        row[`${resElement.alias}_display`] =
          getResistanceDisplayValueCompact(resValue); // Store display value
      });

      return row;
    });
  }, [filteredCharas, language, t, resistanceElementsList]);

  // Define columns
  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: 'name',
        headerName: t.common.name,
        width: 200,
        renderCell: (params) => (
          <MuiLink
            component={Link}
            href={`/${lang}/${version}/charas/${params.row.id}`}
            underline="hover"
          >
            {params.value}
          </MuiLink>
        ),
      },
      {
        field: 'race',
        headerName: t.common.race,
        type: 'singleSelect',
        valueOptions: raceOptions.map(([, name]) => name),
        width: 120,
      },
      {
        field: 'job',
        headerName: t.common.job,
        type: 'singleSelect',
        valueOptions: jobOptions.map(([, name]) => name),
        width: 120,
      },
      {
        field: 'mainElement',
        headerName: t.common.mainElement,
        width: 80,
      },
      {
        field: 'level',
        headerName: t.common.level,
        type: 'number',
        width: 80,
      },
      {
        field: 'geneSlot',
        headerName: t.common.geneSlotShort,
        type: 'number',
        width: 100,
        valueGetter: (_value, row) => row.geneSlotValue,
        renderCell: (params) => params.row.geneSlot,
      },
      {
        field: 'bodyParts',
        headerName: t.common.bodyParts,
        type: 'number',
        width: 80,
        renderCell: (params) => (
          <Tooltip title={params.row.bodyPartsTooltip} arrow placement="top">
            <span style={{ cursor: 'help' }}>{params.value}</span>
          </Tooltip>
        ),
      },
    ];

    // Add status columns
    baseColumns.push(
      {
        field: 'life',
        headerName: t.common.life,
        type: 'number',
        width: 80,
      },
      {
        field: 'mana',
        headerName: t.common.mana,
        type: 'number',
        width: 80,
      },
      {
        field: 'speed',
        headerName: t.common.speed,
        type: 'number',
        width: 80,
      },
      {
        field: 'vigor',
        headerName: t.common.vigor,
        type: 'number',
        width: 80,
      },
      {
        field: 'dv',
        headerName: t.common.dv,
        type: 'number',
        width: 60,
      },
      {
        field: 'pv',
        headerName: t.common.pv,
        type: 'number',
        width: 60,
      }
    );

    // Add primary attribute columns
    // Get attribute list from first chara's primaryAttributes method
    if (filteredCharas.length > 0) {
      const primaryAttrs = filteredCharas[0].primaryAttributes();
      primaryAttrs.forEach((attr) => {
        const element = elementByAlias(version, attr.alias);
        const displayName = element ? element.name(language) : attr.alias;
        baseColumns.push({
          field: attr.alias,
          headerName: displayName,
          type: 'number',
          width: 70,
        });
      });
    }

    baseColumns.push(
      {
        field: 'pdr',
        headerName: t.common.pdr,
        type: 'number',
        width: 60,
      },
      {
        field: 'edr',
        headerName: t.common.edr,
        type: 'number',
        width: 60,
      },
      {
        field: 'ep',
        headerName: t.common.ep,
        type: 'number',
        width: 60,
      }
    );

    // Add tactics columns
    baseColumns.push(
      {
        field: 'tacticsName',
        headerName: t.common.tacticsName,
        width: 120,
      },
      {
        field: 'tacticsDistance',
        headerName: t.common.tacticsDistance,
        type: 'number',
        width: 80,
      },
      {
        field: 'tacticsMoveFrequency',
        headerName: t.common.tacticsMoveFrequency,
        type: 'number',
        width: 100,
      }
    );

    // Add resistance columns
    resistanceElementsList.forEach((resElement) => {
      baseColumns.push({
        field: resElement.alias,
        headerName: resElement.name(language),
        type: 'number',
        width: 80,
        renderCell: (params) => {
          const displayValue = params.row[`${resElement.alias}_display`];
          return displayValue;
        },
      });
    });

    return baseColumns;
  }, [
    t,
    lang,
    version,
    language,
    resistanceElementsList,
    raceOptions,
    jobOptions,
    filteredCharas,
  ]);

  // Create visibility model based on preset and columns
  const createVisibilityModel = useCallback(
    (preset: PresetType): GridColumnVisibilityModel => {
      const model: GridColumnVisibilityModel = {};

      columns.forEach((col) => {
        if (col.field === 'name') {
          model[col.field] = true;
        } else if (preset === 'all') {
          model[col.field] = true;
        } else if (preset === 'primaryAttributes') {
          model[col.field] = PRIMARY_ATTRIBUTE_ALIASES.includes(col.field);
        } else if (preset === 'resistances') {
          model[col.field] = resistanceAliases.includes(col.field);
        } else if (preset === 'tactics') {
          model[col.field] = TACTICS_FIELDS.includes(col.field);
        }
      });

      return model;
    },
    [columns, resistanceAliases]
  );

  const handlePresetChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newPreset: PresetType | null) => {
      if (newPreset !== null) {
        setSelectedPreset(newPreset);
        setColumnVisibilityModel(createVisibilityModel(newPreset));
      }
    },
    [createVisibilityModel]
  );

  // Search bar callback functions
  const handleSearchChange = useCallback(
    (search: string) => {
      setSearchQuery(search);
      updateURL(
        search,
        selectedRaces,
        selectedJobs,
        selectedFeats,
        selectedAbilities,
        showHiddenCharas
      );
    },
    [
      updateURL,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      showHiddenCharas,
    ]
  );

  const handleRaceChange = useCallback(
    (races: string[]) => {
      setSelectedRaces(races);
      updateURL(
        searchQuery,
        races,
        selectedJobs,
        selectedFeats,
        selectedAbilities,
        showHiddenCharas
      );
    },
    [
      updateURL,
      searchQuery,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      showHiddenCharas,
    ]
  );

  const handleJobChange = useCallback(
    (jobs: string[]) => {
      setSelectedJobs(jobs);
      updateURL(
        searchQuery,
        selectedRaces,
        jobs,
        selectedFeats,
        selectedAbilities,
        showHiddenCharas
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedFeats,
      selectedAbilities,
      showHiddenCharas,
    ]
  );

  const handleFeatChange = useCallback(
    (feats: string[]) => {
      setSelectedFeats(feats);
      updateURL(
        searchQuery,
        selectedRaces,
        selectedJobs,
        feats,
        selectedAbilities,
        showHiddenCharas
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedAbilities,
      showHiddenCharas,
    ]
  );

  const handleAbilityChange = useCallback(
    (abilities: string[]) => {
      setSelectedAbilities(abilities);
      updateURL(
        searchQuery,
        selectedRaces,
        selectedJobs,
        selectedFeats,
        abilities,
        showHiddenCharas
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      showHiddenCharas,
    ]
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRaces([]);
    setSelectedJobs([]);
    setSelectedFeats([]);
    setSelectedAbilities([]);
    setShowHiddenCharas(false);
    updateURL('', [], [], [], [], false);
  }, [updateURL]);

  return (
    <Box sx={{ width: '100%' }}>
      <CharaSearchBar
        raceOptions={raceOptions}
        jobOptions={jobOptions}
        featOptions={featOptions}
        abilityOptions={abilityOptions}
        initialSearchQuery={searchQuery}
        initialSelectedRaces={selectedRaces}
        initialSelectedJobs={selectedJobs}
        initialSelectedFeats={selectedFeats}
        initialSelectedAbilities={selectedAbilities}
        initialShowHiddenCharas={showHiddenCharas}
        onSearchChange={handleSearchChange}
        onRaceChange={handleRaceChange}
        onJobChange={handleJobChange}
        onFeatChange={handleFeatChange}
        onAbilityChange={handleAbilityChange}
        onClearAllFilters={handleClearAllFilters}
      />
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <span>{t.common.columnPreset}:</span>
        <ToggleButtonGroup
          value={selectedPreset}
          exclusive
          onChange={handlePresetChange}
          size="small"
        >
          <ToggleButton value="all">{t.common.presetAll}</ToggleButton>
          <ToggleButton value="primaryAttributes">
            {t.common.presetPrimaryAttributes}
          </ToggleButton>
          <ToggleButton value="resistances">
            {t.common.presetResistances}
          </ToggleButton>
          <ToggleButton value="tactics">{t.common.presetTactics}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            sorting: {
              sortModel: [],
            },
            filter: {
              filterModel: {
                items: [],
                quickFilterExcludeHiddenColumns: true,
              },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-toolbarContainer': {
              padding: 2,
            },
          }}
        />
      </Paper>
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showHiddenCharas}
              onChange={(e) => {
                const newValue = e.target.checked;
                setShowHiddenCharas(newValue);
                updateURL(
                  searchQuery,
                  selectedRaces,
                  selectedJobs,
                  selectedFeats,
                  selectedAbilities,
                  newValue
                );
              }}
            />
          }
          label={t.common.showHiddenCharacters}
        />
      </Box>
    </Box>
  );
}
