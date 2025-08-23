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
} from '@mui/x-data-grid';
import { Link as MuiLink, Tooltip, Paper, Box } from '@mui/material';
import Link from 'next/link';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Chara } from '@/lib/models/chara';
import { resistanceElements, elementByAlias } from '@/lib/models/element';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';
import CharaSearchBar from './CharaSearchBar';

interface DataGridCharaTableProps {
  charas: Chara[];
}

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

export default function DataGridCharaTable({
  charas,
}: DataGridCharaTableProps) {
  const { t, language } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params.lang as string;
  const version = params.version as string;
  const resistanceElementsList = resistanceElements();

  // Custom filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  // Initialize state from URL parameters
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const races = searchParams.get('races')?.split(',').filter(Boolean) || [];
    const jobs = searchParams.get('jobs')?.split(',').filter(Boolean) || [];
    const feats = searchParams.get('feats')?.split(',').filter(Boolean) || [];
    const abilities =
      searchParams.get('abilities')?.split(',').filter(Boolean) || [];

    setSearchQuery(query);
    setSelectedRaces(races);
    setSelectedJobs(jobs);
    setSelectedFeats(feats);
    setSelectedAbilities(abilities);
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(
    (
      query: string,
      races: string[],
      jobs: string[],
      feats: string[],
      abilities: string[]
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

      const newUrl = urlSearchParams.toString()
        ? `/${lang}/charas?${urlSearchParams.toString()}`
        : `/${lang}/charas`;

      router.replace(newUrl, { scroll: false });
    },
    [lang, router]
  );

  // Convert Chara objects to DataGrid rows
  // Get unique race, job, feat, and ability options for select filters
  const { raceOptions, jobOptions, featOptions, abilityOptions } =
    useMemo(() => {
      const raceSet = new Set<string>();
      const jobSet = new Set<string>();
      const featMap = new Map<string, string>();
      const abilityMap = new Map<string, string>();

      charas.forEach((chara) => {
        raceSet.add(chara.race.name(language));
        jobSet.add(chara.job().name(language));

        // Feats
        chara.feats().forEach((feat) => {
          featMap.set(feat.element.alias, feat.element.name(language));
        });

        // Abilities
        chara.abilities().forEach((ability) => {
          const baseElement = elementByAlias(ability.name);
          const elementElement = ability.element
            ? (elementByAlias(ability.element) ?? null)
            : null;

          let baseAbilityName: string;
          if (baseElement) {
            baseAbilityName = baseElement.abilityName(elementElement, language);
          } else {
            baseAbilityName = ability.name;
          }

          // Always add the normal variant (party: false)
          const normalKey = `${ability.name}:false`;
          abilityMap.set(normalKey, baseAbilityName);

          // Add party variant only if this ability actually has party: true
          if (ability.party) {
            const partyKey = `${ability.name}:true`;
            const partyAbilityName = `${baseAbilityName} (${t.common.range})`;
            abilityMap.set(partyKey, partyAbilityName);
          }
        });
      });

      return {
        raceOptions: Array.from(raceSet).sort(),
        jobOptions: Array.from(jobSet).sort(),
        featOptions: Array.from(featMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
        abilityOptions: Array.from(abilityMap.entries()).sort((a, b) =>
          a[1].localeCompare(b[1])
        ),
      };
    }, [charas, language, t.common.range]);

  // Apply custom filters to charas
  const filteredCharas = useMemo(() => {
    return charas.filter((chara) => {
      // Search query filter
      if (searchQuery) {
        const normalizedName = chara.normalizedName(language).toLowerCase();
        if (!normalizedName.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Race filter
      if (selectedRaces.length > 0) {
        const charaRace = chara.race.name(language);
        if (!selectedRaces.includes(charaRace)) {
          return false;
        }
      }

      // Job filter
      if (selectedJobs.length > 0) {
        const charaJob = chara.job().name(language);
        if (!selectedJobs.includes(charaJob)) {
          return false;
        }
      }

      // Feats filter
      if (selectedFeats.length > 0) {
        const charaFeats = chara
          .feats()
          .map((feat) => feat.element.name(language));
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
            // selectedAbility format: "abilityName (範囲)" or "abilityName"
            // Determine if this is a party variant by checking for range text
            const isPartyVariant = selectedAbility.includes(
              `(${t.common.range})`
            );
            const baseAbilityName = isPartyVariant
              ? selectedAbility.replace(` (${t.common.range})`, '')
              : selectedAbility;

            // Check if any chara ability matches the selected criteria
            return charaAbilities.some((ability) => {
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

              // Check if ability name matches and party status matches
              return (
                abilityName === baseAbilityName &&
                ability.party === isPartyVariant
              );
            });
          }
        );
        if (!hasAllSelectedAbilities) return false;
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
    language,
    t.common.range,
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
        level: Math.round(chara.level() * 100) / 100,
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
      row.pdr = chara.pdr();
      row.edr = chara.edr();
      row.ep = chara.ep();

      // Add resistance columns
      resistanceElementsList.forEach((resElement) => {
        const resValue = chara.getElementPower(resElement.alias) || 0;
        row[resElement.alias] = getResistanceDisplayValueCompact(resValue);
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
        valueOptions: raceOptions,
        width: 120,
      },
      {
        field: 'job',
        headerName: t.common.job,
        type: 'singleSelect',
        valueOptions: jobOptions,
        width: 120,
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
        width: 100,
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
      },
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

    // Add resistance columns
    resistanceElementsList.forEach((resElement) => {
      baseColumns.push({
        field: resElement.alias,
        headerName: resElement.name(language),
        width: 80,
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
  ]);

  // Search bar callback functions
  const handleSearchChange = useCallback(
    (search: string) => {
      setSearchQuery(search);
      updateURL(
        search,
        selectedRaces,
        selectedJobs,
        selectedFeats,
        selectedAbilities
      );
    },
    [updateURL, selectedRaces, selectedJobs, selectedFeats, selectedAbilities]
  );

  const handleRaceChange = useCallback(
    (races: string[]) => {
      setSelectedRaces(races);
      updateURL(
        searchQuery,
        races,
        selectedJobs,
        selectedFeats,
        selectedAbilities
      );
    },
    [updateURL, searchQuery, selectedJobs, selectedFeats, selectedAbilities]
  );

  const handleJobChange = useCallback(
    (jobs: string[]) => {
      setSelectedJobs(jobs);
      updateURL(
        searchQuery,
        selectedRaces,
        jobs,
        selectedFeats,
        selectedAbilities
      );
    },
    [updateURL, searchQuery, selectedRaces, selectedFeats, selectedAbilities]
  );

  const handleFeatChange = useCallback(
    (feats: string[]) => {
      setSelectedFeats(feats);
      updateURL(
        searchQuery,
        selectedRaces,
        selectedJobs,
        feats,
        selectedAbilities
      );
    },
    [updateURL, searchQuery, selectedRaces, selectedJobs, selectedAbilities]
  );

  const handleAbilityChange = useCallback(
    (abilities: string[]) => {
      setSelectedAbilities(abilities);
      updateURL(
        searchQuery,
        selectedRaces,
        selectedJobs,
        selectedFeats,
        abilities
      );
    },
    [updateURL, searchQuery, selectedRaces, selectedJobs, selectedFeats]
  );

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
        onSearchChange={handleSearchChange}
        onRaceChange={handleRaceChange}
        onJobChange={handleJobChange}
        onFeatChange={handleFeatChange}
        onAbilityChange={handleAbilityChange}
      />
      <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
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
    </Box>
  );
}
