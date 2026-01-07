'use client';
import {
  DataGrid,
  GridColDef,
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
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { RaceSchema } from '@/lib/models/race';
import { JobSchema } from '@/lib/models/job';
import { TacticsSchema } from '@/lib/models/tactics';
import { GameVersion } from '@/lib/db';
import {
  resistanceElements,
  elementByAlias,
  skillElements,
  PRIMARY_ATTRIBUTE_ALIASES,
  STATS_ALIASES,
} from '@/lib/models/element';
import { skillSortKey, calcBasePotential, totalPower } from '@/lib/elementable';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';
import CharaSearchBar from './CharaSearchBar';
import { normalizeForSearch } from '@/lib/searchUtils';
import { AdvancedSearchPanel } from './AdvancedSearch';
import {
  AdvancedSearchState,
  createEmptyAdvancedSearchState,
  extractSelectedFields,
} from '@/lib/advancedSearchTypes';
import {
  getFieldInfoList,
  evaluateAdvancedSearch,
  serializeAdvancedSearch,
  deserializeAdvancedSearch,
  RawFieldsInfo,
  TACTICS_FIELDS,
} from '@/lib/advancedSearchUtils';

interface DataGridCharaTableProps {
  charas: Chara[];
  version: GameVersion;
}

// Extract field names and numeric fields from Zod schema
function extractSchemaInfo(schema: z.ZodObject<z.ZodRawShape>): {
  fields: string[];
  numericFields: Set<string>;
} {
  const shape = schema.shape;
  const fields: string[] = [];
  const numericFields = new Set<string>();

  for (const [key, fieldSchema] of Object.entries(shape)) {
    // Skip __meta field
    if (key === '__meta') continue;
    // Skip '***' field (separator in source data)
    if (key === '***') continue;

    fields.push(key);

    // Check if field is numeric (handles z.coerce.number() and z.coerce.number().optional())
    if (isNumericSchema(fieldSchema as z.ZodTypeAny)) {
      numericFields.add(key);
    }
  }

  return { fields, numericFields };
}

function isNumericSchema(schema: z.ZodTypeAny): boolean {
  // Access internal Zod structure to determine type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._zpiType ?? (schema as any)._def;
  if (!def) return false;

  const typeName = def.type ?? def.typeName;

  // Handle optional wrapper
  if (typeName === 'optional' || typeName === 'ZodOptional') {
    const inner = def.innerType ?? def.value;
    if (inner) return isNumericSchema(inner);
  }
  // Handle effects (z.coerce creates effects)
  if (typeName === 'effects' || typeName === 'ZodEffects') {
    const inner = def.schema ?? def.value;
    if (inner) return isNumericSchema(inner);
  }
  return typeName === 'number' || typeName === 'ZodNumber';
}

// Extract schema info for each model
const { fields: CHARA_RAW_FIELDS, numericFields: CHARA_NUMERIC_FIELDS } =
  extractSchemaInfo(CharaSchema);
const { fields: RACE_RAW_FIELDS, numericFields: RACE_NUMERIC_FIELDS } =
  extractSchemaInfo(RaceSchema);
const { fields: JOB_RAW_FIELDS, numericFields: JOB_NUMERIC_FIELDS } =
  extractSchemaInfo(JobSchema);
const { fields: TACTICS_RAW_FIELDS, numericFields: TACTICS_NUMERIC_FIELDS } =
  extractSchemaInfo(TacticsSchema);

// Key info column fields
const KEY_INFO_FIELDS = [
  'race',
  'job',
  'mainElement',
  'level',
  'geneSlot',
  'bodyParts',
  'life',
  'mana',
  'speed',
  'tacticsName',
];

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
  const searchParams = useSearchParams();
  const lang = params.lang as string;
  const resistanceElementsList = resistanceElements(version);

  // Get skill elements with same sorting as CharaDetailClient
  const sortedSkillElements = useMemo(() => {
    const elements = skillElements(version);
    // Sort using skillSortKey (same as CharaDetailClient)
    return elements.sort((a, b) => {
      const [aCatSub, aParent, aId] = skillSortKey(a);
      const [bCatSub, bParent, bId] = skillSortKey(b);
      return aCatSub - bCatSub || aParent - bParent || aId - bId;
    });
  }, [version]);
  const skillAliases = useMemo(
    () => sortedSkillElements.map((e) => e.alias),
    [sortedSkillElements]
  );

  // Resistance element aliases
  const resistanceAliases = useMemo(
    () => resistanceElementsList.map((e) => e.alias),
    [resistanceElementsList]
  );

  // Column presets (excludes 'all' as it's handled separately)
  type PresetType =
    | 'keyInfo'
    | 'otherStats'
    | 'primaryAttributes'
    | 'skills'
    | 'resistances'
    | 'tactics'
    | 'rawData';

  // Column visibility state (default to keyInfo preset)
  const [selectedPresets, setSelectedPresets] = useState<PresetType[]>([
    'keyInfo',
  ]);
  // DataGrid経由の手動列選択（ベースからの差分）のみを保存
  const [manualVisibilityOverrides, setManualVisibilityOverrides] =
    useState<GridColumnVisibilityModel>({});

  // Custom filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [selectedOthers, setSelectedOthers] = useState<string[]>([]);
  const [showHiddenCharas, setShowHiddenCharas] = useState(false);
  const [advancedSearchState, setAdvancedSearchState] =
    useState<AdvancedSearchState>(createEmptyAdvancedSearchState());

  // Flag to skip URL parameter reading after local state changes
  const isLocalAdvancedSearchUpdate = useRef(false);

  // Raw fields info for advanced search
  const rawFieldsInfo: RawFieldsInfo = useMemo(
    () => ({
      charaFields: CHARA_RAW_FIELDS,
      charaNumericFields: CHARA_NUMERIC_FIELDS,
      raceFields: RACE_RAW_FIELDS,
      raceNumericFields: RACE_NUMERIC_FIELDS,
      jobFields: JOB_RAW_FIELDS,
      jobNumericFields: JOB_NUMERIC_FIELDS,
      tacticsFields: TACTICS_RAW_FIELDS,
      tacticsNumericFields: TACTICS_NUMERIC_FIELDS,
    }),
    []
  );

  // Get field info for advanced search
  const advancedSearchFields = useMemo(
    () => getFieldInfoList(language, version, charas, t, rawFieldsInfo),
    [language, version, charas, t, rawFieldsInfo]
  );

  // Initialize state from URL parameters
  // This effect synchronizes external state (URL params) with component state
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const races = searchParams.get('races')?.split(',').filter(Boolean) || [];
    const jobs = searchParams.get('jobs')?.split(',').filter(Boolean) || [];
    const feats = searchParams.get('feats')?.split(',').filter(Boolean) || [];
    const abilities =
      searchParams.get('abilities')?.split(',').filter(Boolean) || [];
    const others = searchParams.get('others')?.split(',').filter(Boolean) || [];
    const hidden = searchParams.get('hidden') === 'true';

    // URLパラメータから状態を初期化（外部状態との同期）

    setSearchQuery(query);

    setSelectedRaces(races);

    setSelectedJobs(jobs);

    setSelectedFeats(feats);

    setSelectedAbilities(abilities);

    setSelectedOthers(others);

    setShowHiddenCharas(hidden);

    // Skip advanced search URL reading if it was a local update
    if (isLocalAdvancedSearchUpdate.current) {
      isLocalAdvancedSearchUpdate.current = false;
      return;
    }

    const advParam = searchParams.get('adv') || '';
    const advState = deserializeAdvancedSearch(advParam);
    if (advState) {
      setAdvancedSearchState(advState);
    } else {
      setAdvancedSearchState(createEmptyAdvancedSearchState());
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(
    (
      query: string,
      races: string[],
      jobs: string[],
      feats: string[],
      abilities: string[],
      others: string[],
      hidden: boolean,
      advSearch?: AdvancedSearchState
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
      if (others.length > 0) {
        urlSearchParams.set('others', others.join(','));
      }
      if (hidden) {
        urlSearchParams.set('hidden', 'true');
      }
      if (advSearch) {
        const serialized = serializeAdvancedSearch(advSearch);
        if (serialized) {
          urlSearchParams.set('adv', serialized);
        }
      }

      const newUrl = urlSearchParams.toString()
        ? `/${lang}/${version}/charas?${urlSearchParams.toString()}`
        : `/${lang}/${version}/charas`;

      // Use history.replaceState instead of router.replace to avoid page reload
      window.history.replaceState(null, '', newUrl);
    },
    [lang, version]
  );

  // Convert Chara objects to DataGrid rows
  // Get unique race, job, feat, ability, and other options for select filters
  // Each option has { key, displayName, nameJa, nameEn } for bilingual search
  const { raceOptions, jobOptions, featOptions, abilityOptions, otherOptions } =
    useMemo(() => {
      const raceMap = new Map<
        string,
        { displayName: string; nameJa: string; nameEn: string }
      >();
      const jobMap = new Map<
        string,
        { displayName: string; nameJa: string; nameEn: string }
      >();
      const featMap = new Map<
        string,
        { displayName: string; nameJa: string; nameEn: string }
      >();
      const abilityMap = new Map<
        string,
        { displayName: string; nameJa: string; nameEn: string }
      >();
      const otherMap = new Map<
        string,
        { displayName: string; nameJa: string; nameEn: string }
      >();

      charas.forEach((chara) => {
        raceMap.set(chara.race.id, {
          displayName: chara.race.name(language),
          nameJa: chara.race.name('ja'),
          nameEn: chara.race.name('en'),
        });
        jobMap.set(chara.job().id, {
          displayName: chara.job().name(language),
          nameJa: chara.job().name('ja'),
          nameEn: chara.job().name('en'),
        });

        // Feats
        chara.feats().forEach((feat) => {
          featMap.set(feat.element.alias, {
            displayName: feat.element.name(language),
            nameJa: feat.element.name('ja'),
            nameEn: feat.element.name('en'),
          });
        });

        // Abilities
        chara.abilities().forEach((ability) => {
          const baseElement = elementByAlias(version, ability.name);
          const elementElement = ability.element
            ? (elementByAlias(version, ability.element) ?? null)
            : null;

          let baseAbilityNameDisplay: string;
          let baseAbilityNameJa: string;
          let baseAbilityNameEn: string;
          if (baseElement) {
            baseAbilityNameDisplay = baseElement.abilityName(
              elementElement,
              language
            );
            baseAbilityNameJa = baseElement.abilityName(elementElement, 'ja');
            baseAbilityNameEn = baseElement.abilityName(elementElement, 'en');
          } else {
            baseAbilityNameDisplay = ability.name;
            baseAbilityNameJa = ability.name;
            baseAbilityNameEn = ability.name;
          }

          const key = abilityToSearchKey(ability);

          // Add party variant only if this ability actually has party: true
          if (ability.party) {
            abilityMap.set(key, {
              displayName: `${baseAbilityNameDisplay} (${t.common.range})`,
              nameJa: `${baseAbilityNameJa} (${t.common.range})`,
              nameEn: `${baseAbilityNameEn} (${t.common.range})`,
            });
          } else {
            abilityMap.set(key, {
              displayName: baseAbilityNameDisplay,
              nameJa: baseAbilityNameJa,
              nameEn: baseAbilityNameEn,
            });
          }
        });

        // Others (elements that are not feat, negation, ele*, res*, skill, attribute)
        chara.others().forEach((other) => {
          const element = other.element;
          otherMap.set(element.alias, {
            displayName: element.name(language),
            nameJa: element.name('ja'),
            nameEn: element.name('en'),
          });
        });
      });

      // Convert to { key, displayName, nameJa, nameEn } format
      return {
        raceOptions: Array.from(raceMap.entries())
          .map(([key, names]) => ({ key, ...names }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        jobOptions: Array.from(jobMap.entries())
          .map(([key, names]) => ({ key, ...names }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        featOptions: Array.from(featMap.entries())
          .map(([key, names]) => ({ key, ...names }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        abilityOptions: Array.from(abilityMap.entries())
          .map(([key, names]) => ({ key, ...names }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        otherOptions: Array.from(otherMap.entries())
          .map(([key, names]) => ({ key, ...names }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      };
    }, [charas, language, t.common.range, version]);

  // Charaからrow（DataGrid用のデータ行）を生成する関数
  const createCharaRow = useCallback(
    (chara: Chara): Record<string, unknown> => {
      const bodyParts = chara.bodyParts();
      const totalParts = chara.totalBodyParts();

      const [actualGeneSlot, originalGeneSlot] = chara.geneSlot();

      const row: Record<string, unknown> = {
        id: chara.id,
        name: chara.normalizedName(language),
        race: chara.race.name(language),
        job: chara.job().name(language),
        mainElement: chara.mainElement?.name(language) ?? '',
        level: Math.round(chara.level() * 100) / 100,
        geneSlot: actualGeneSlot,
        geneSlotOriginal: originalGeneSlot,
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

      // Add skill columns (base potential values)
      const charaElements = chara.elements();
      sortedSkillElements.forEach((skillElement) => {
        const found = charaElements.find(
          (ewp) => ewp.element.alias === skillElement.alias
        );
        if (found) {
          const basePotential = calcBasePotential(found);
          row[skillElement.alias] = basePotential;
        } else {
          row[skillElement.alias] = null;
        }
      });

      row.pdr = chara.pdr();
      row.edr = chara.edr();
      row.ep = chara.ep();

      // Add tactics columns
      const tactics = chara.tactics();
      row.tacticsName = tactics.name(language);
      row.tacticsDistance = chara.tacticsDistance();
      row.tacticsMoveFrequency = chara.tacticsMoveFrequency();
      row.tacticsParty = tactics.party;
      row.tacticsTaunt = tactics.taunt;
      row.tacticsMelee = tactics.melee;
      row.tacticsRange = tactics.range;
      row.tacticsSpell = tactics.spell;
      row.tacticsHeal = tactics.heal;
      row.tacticsSummon = tactics.summon;
      row.tacticsBuff = tactics.buff;
      row.tacticsDebuff = tactics.debuff;
      row.tacticsPartyBuff = tactics.usesPartyBuff()
        ? t.common.yes
        : t.common.no;

      // Add resistance columns
      resistanceElementsList.forEach((resElement) => {
        const resValue = chara.getElementPower(resElement.alias) || 0;
        row[resElement.alias] = resValue; // Store numeric value for sorting
        row[`${resElement.alias}_display`] =
          getResistanceDisplayValueCompact(resValue); // Store display value
      });

      // Add selected feat columns (dynamic)
      const charaFeats = chara.feats();
      selectedFeats.forEach((featAlias) => {
        const feat = charaFeats.find((f) => f.element.alias === featAlias);
        row[`filter_feat_${featAlias}`] = feat ? totalPower(feat) : null;
      });

      // Add selected other element columns (dynamic)
      const charaOthers = chara.others();
      selectedOthers.forEach((otherAlias) => {
        const other = charaOthers.find((o) => o.element.alias === otherAlias);
        row[`filter_other_${otherAlias}`] = other ? totalPower(other) : null;
      });

      // Add raw data columns (excluding __meta)
      const charaRow = chara.row as Record<string, unknown>;
      CHARA_RAW_FIELDS.forEach((field) => {
        row[`chara.${field}`] = charaRow[field] ?? '';
      });

      const raceRow = chara.race.row as Record<string, unknown>;
      RACE_RAW_FIELDS.forEach((field) => {
        row[`race.${field}`] = raceRow[field] ?? '';
      });

      const jobRow = chara.job().row as Record<string, unknown>;
      JOB_RAW_FIELDS.forEach((field) => {
        row[`job.${field}`] = jobRow[field] ?? '';
      });

      const tacticsRow = tactics.row as Record<string, unknown>;
      TACTICS_RAW_FIELDS.forEach((field) => {
        row[`tactics.${field}`] = tacticsRow[field] ?? '';
      });

      return row;
    },
    [
      language,
      t,
      resistanceElementsList,
      sortedSkillElements,
      selectedFeats,
      selectedOthers,
    ]
  );

  // Apply custom filters to charas and generate rows
  // rowを先に生成して高度検索でDataGridと同じ値を使う
  const rows = useMemo(() => {
    const rowList: Record<string, unknown>[] = [];

    for (const chara of charas) {
      // Search query filter (search both Japanese and English names)
      if (searchQuery) {
        const normalizedQuery = normalizeForSearch(searchQuery);
        const nameJa = normalizeForSearch(chara.normalizedName('ja'));
        const nameEn = normalizeForSearch(chara.normalizedName('en'));
        if (
          !nameJa.includes(normalizedQuery) &&
          !nameEn.includes(normalizedQuery)
        ) {
          continue;
        }
      }

      // Race filter
      if (selectedRaces.length > 0) {
        const charaRace = chara.race.id;
        if (!selectedRaces.includes(charaRace)) {
          continue;
        }
      }

      // Job filter
      if (selectedJobs.length > 0) {
        const charaJob = chara.job().id;
        if (!selectedJobs.includes(charaJob)) {
          continue;
        }
      }

      // Feats filter
      if (selectedFeats.length > 0) {
        const charaFeats = chara.feats().map((feat) => feat.element.alias);
        const hasAllSelectedFeats = selectedFeats.every((feat) =>
          charaFeats.includes(feat)
        );
        if (!hasAllSelectedFeats) continue;
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
        if (!hasAllSelectedAbilities) continue;
      }

      // Others filter
      if (selectedOthers.length > 0) {
        const charaOthers = chara.others().map((other) => other.element.alias);
        const hasAllSelectedOthers = selectedOthers.every((other) =>
          charaOthers.includes(other)
        );
        if (!hasAllSelectedOthers) continue;
      }

      // Hidden characters filter
      if (!showHiddenCharas && chara.isHidden()) {
        continue;
      }

      // Advanced search filter
      // enabledはアコーディオンの開閉状態を示すだけで、条件があれば常に適用される
      if (advancedSearchState.conditions.length > 0) {
        // rowを生成してevaluateAdvancedSearchに渡す（DataGridと同じ値で比較）
        const row = createCharaRow(chara);
        if (!evaluateAdvancedSearch(row, advancedSearchState)) {
          continue;
        }
        // フィルタを通過したらrowを再利用
        rowList.push(row);
      } else {
        // 高度検索がない場合はここでrowを生成
        rowList.push(createCharaRow(chara));
      }
    }

    return rowList;
  }, [
    charas,
    searchQuery,
    selectedRaces,
    selectedJobs,
    selectedFeats,
    selectedAbilities,
    selectedOthers,
    showHiddenCharas,
    advancedSearchState,
    createCharaRow,
  ]);

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
    ];

    // Add dynamic feat columns (right after name)
    selectedFeats.forEach((featAlias) => {
      const featOption = featOptions.find((opt) => opt.key === featAlias);
      baseColumns.push({
        field: `filter_feat_${featAlias}`,
        headerName: featOption?.displayName ?? featAlias,
        type: 'number',
        width: 100,
      });
    });

    // Add dynamic other element columns (right after feats)
    selectedOthers.forEach((otherAlias) => {
      const otherOption = otherOptions.find((opt) => opt.key === otherAlias);
      baseColumns.push({
        field: `filter_other_${otherAlias}`,
        headerName: otherOption?.displayName ?? otherAlias,
        type: 'number',
        width: 100,
      });
    });

    // Add remaining base info columns
    baseColumns.push(
      {
        field: 'race',
        headerName: t.common.race,
        type: 'singleSelect',
        valueOptions: raceOptions.map((opt) => opt.displayName),
        width: 120,
      },
      {
        field: 'job',
        headerName: t.common.job,
        type: 'singleSelect',
        valueOptions: jobOptions.map((opt) => opt.displayName),
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
        renderCell: (params) => {
          const actual = params.row.geneSlot;
          const original = params.row.geneSlotOriginal;
          return actual !== original ? `${actual} (${original})` : actual;
        },
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
      }
    );

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
    PRIMARY_ATTRIBUTE_ALIASES.forEach((alias) => {
      const element = elementByAlias(version, alias);
      const displayName = element ? element.name(language) : alias;
      baseColumns.push({
        field: alias,
        headerName: displayName,
        type: 'number',
        width: 70,
      });
    });

    // Add skill columns (base potential values)
    sortedSkillElements.forEach((skillElement) => {
      baseColumns.push({
        field: skillElement.alias,
        headerName: skillElement.name(language),
        type: 'number',
        width: 70,
      });
    });

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
      },
      {
        field: 'tacticsParty',
        headerName: t.common.tacticsParty,
        type: 'number',
        width: 80,
      },
      {
        field: 'tacticsTaunt',
        headerName: t.common.tacticsTaunt,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsMelee',
        headerName: t.common.tacticsMelee,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsRange',
        headerName: t.common.tacticsRange,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsSpell',
        headerName: t.common.tacticsSpell,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsHeal',
        headerName: t.common.tacticsHeal,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsSummon',
        headerName: t.common.tacticsSummon,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsBuff',
        headerName: t.common.tacticsBuff,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsDebuff',
        headerName: t.common.tacticsDebuff,
        type: 'number',
        width: 70,
      },
      {
        field: 'tacticsPartyBuff',
        headerName: t.common.tacticsPartyBuff,
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

    // Add raw data columns for chara, race, job, tactics
    CHARA_RAW_FIELDS.forEach((field) => {
      baseColumns.push({
        field: `chara.${field}`,
        headerName: `chara.${field}`,
        type: CHARA_NUMERIC_FIELDS.has(field) ? 'number' : undefined,
        width: 120,
      });
    });

    RACE_RAW_FIELDS.forEach((field) => {
      baseColumns.push({
        field: `race.${field}`,
        headerName: `race.${field}`,
        type: RACE_NUMERIC_FIELDS.has(field) ? 'number' : undefined,
        width: 120,
      });
    });

    JOB_RAW_FIELDS.forEach((field) => {
      baseColumns.push({
        field: `job.${field}`,
        headerName: `job.${field}`,
        type: JOB_NUMERIC_FIELDS.has(field) ? 'number' : undefined,
        width: 120,
      });
    });

    TACTICS_RAW_FIELDS.forEach((field) => {
      baseColumns.push({
        field: `tactics.${field}`,
        headerName: `tactics.${field}`,
        type: TACTICS_NUMERIC_FIELDS.has(field) ? 'number' : undefined,
        width: 120,
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
    sortedSkillElements,
    selectedFeats,
    selectedOthers,
    featOptions,
    otherOptions,
  ]);

  // Get fields selected in advanced search
  const advancedSearchSelectedFields = useMemo(
    () => extractSelectedFields(advancedSearchState),
    [advancedSearchState]
  );

  // Set<string>をソートした文字列キーに変換（依存配列での安定した比較用）
  const advSearchFieldsKey = useMemo(
    () => Array.from(advancedSearchSelectedFields).sort().join(','),
    [advancedSearchSelectedFields]
  );

  // Create visibility model based on selected presets and advanced search fields
  const createVisibilityModel = useCallback(
    (
      presets: PresetType[],
      advSearchFields: Set<string>
    ): GridColumnVisibilityModel => {
      const model: GridColumnVisibilityModel = {};

      // If no presets selected, show all columns
      const showAll = presets.length === 0;

      columns.forEach((col) => {
        // Always show name column
        if (col.field === 'name') {
          model[col.field] = true;
        }
        // Always show dynamic filter columns (feats and other elements)
        else if (
          col.field.startsWith('filter_feat_') ||
          col.field.startsWith('filter_other_')
        ) {
          model[col.field] = true;
        }
        // Show columns selected in advanced search
        else if (advSearchFields.has(col.field)) {
          model[col.field] = true;
        } else if (showAll) {
          model[col.field] = true;
        } else {
          // Show column if it belongs to any of the selected presets
          const inKeyInfo =
            presets.includes('keyInfo') && KEY_INFO_FIELDS.includes(col.field);
          const inOtherStats =
            presets.includes('otherStats') &&
            (STATS_ALIASES as readonly string[]).includes(col.field);
          const inPrimaryAttributes =
            presets.includes('primaryAttributes') &&
            (PRIMARY_ATTRIBUTE_ALIASES as readonly string[]).includes(
              col.field
            );
          const inSkills =
            presets.includes('skills') && skillAliases.includes(col.field);
          const inResistances =
            presets.includes('resistances') &&
            resistanceAliases.includes(col.field);
          const inTactics =
            presets.includes('tactics') &&
            (TACTICS_FIELDS as readonly string[]).includes(col.field);
          const inRawData =
            presets.includes('rawData') &&
            (col.field.startsWith('chara.') ||
              col.field.startsWith('race.') ||
              col.field.startsWith('job.') ||
              col.field.startsWith('tactics.'));

          model[col.field] =
            inKeyInfo ||
            inOtherStats ||
            inPrimaryAttributes ||
            inSkills ||
            inResistances ||
            inTactics ||
            inRawData;
        }
      });

      return model;
    },
    [columns, resistanceAliases, skillAliases]
  );

  // プリセットと高度な検索から計算される基本の表示モデル
  const baseVisibilityModel = useMemo(
    () => createVisibilityModel(selectedPresets, advancedSearchSelectedFields),
    // advSearchFieldsKeyは文字列なので安定した比較が可能
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createVisibilityModel, selectedPresets, advSearchFieldsKey]
  );

  // 基本モデルに手動オーバーライドを適用した最終的な表示モデル
  const effectiveVisibilityModel = useMemo(() => {
    return { ...baseVisibilityModel, ...manualVisibilityOverrides };
  }, [baseVisibilityModel, manualVisibilityOverrides]);

  // DataGridからの列表示変更を処理（baseとの差分のみをoverridesとして保存）
  const handleColumnVisibilityModelChange = useCallback(
    (newModel: GridColumnVisibilityModel) => {
      const overrides: GridColumnVisibilityModel = {};
      for (const [field, visible] of Object.entries(newModel)) {
        // baseモデルと異なる値のみをオーバーライドとして保存
        if (baseVisibilityModel[field] !== visible) {
          overrides[field] = visible;
        }
      }
      setManualVisibilityOverrides(overrides);
    },
    [baseVisibilityModel]
  );

  const handlePresetChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newPresets: PresetType[]) => {
      setSelectedPresets(newPresets);
      // プリセット変更時は手動オーバーライドをリセット
      setManualVisibilityOverrides({});
    },
    []
  );

  const handleShowAllColumns = useCallback(() => {
    setSelectedPresets([]);
    // 全表示時は手動オーバーライドをリセット
    setManualVisibilityOverrides({});
  }, []);

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
        selectedOthers,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState,
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
        selectedOthers,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      searchQuery,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState,
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
        selectedOthers,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedFeats,
      selectedAbilities,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState,
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
        selectedOthers,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedAbilities,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState,
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
        selectedOthers,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState,
    ]
  );

  const handleOtherChange = useCallback(
    (others: string[]) => {
      setSelectedOthers(others);
      updateURL(
        searchQuery,
        selectedRaces,
        selectedJobs,
        selectedFeats,
        selectedAbilities,
        others,
        showHiddenCharas,
        advancedSearchState
      );
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      showHiddenCharas,
      advancedSearchState,
    ]
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRaces([]);
    setSelectedJobs([]);
    setSelectedFeats([]);
    setSelectedAbilities([]);
    setSelectedOthers([]);
    setShowHiddenCharas(false);
    setAdvancedSearchState(createEmptyAdvancedSearchState());
    updateURL('', [], [], [], [], [], false);
  }, [updateURL]);

  const handleAdvancedSearchChange = useCallback(
    (newState: AdvancedSearchState) => {
      const prevHadConditions = advancedSearchState.conditions.length > 0;
      const newHasConditions = newState.conditions.length > 0;

      setAdvancedSearchState(newState);

      // Update URL when:
      // 1. New state has conditions (serialize them)
      // 2. Previous state had conditions but new state doesn't (clear adv param)
      // Skip URL update when just opening/closing accordion with no conditions
      if (newHasConditions || prevHadConditions) {
        isLocalAdvancedSearchUpdate.current = true;
        updateURL(
          searchQuery,
          selectedRaces,
          selectedJobs,
          selectedFeats,
          selectedAbilities,
          selectedOthers,
          showHiddenCharas,
          newState
        );
      }
    },
    [
      updateURL,
      searchQuery,
      selectedRaces,
      selectedJobs,
      selectedFeats,
      selectedAbilities,
      selectedOthers,
      showHiddenCharas,
      advancedSearchState.conditions.length,
    ]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <CharaSearchBar
        raceOptions={raceOptions}
        jobOptions={jobOptions}
        featOptions={featOptions}
        abilityOptions={abilityOptions}
        otherOptions={otherOptions}
        initialSearchQuery={searchQuery}
        initialSelectedRaces={selectedRaces}
        initialSelectedJobs={selectedJobs}
        initialSelectedFeats={selectedFeats}
        initialSelectedAbilities={selectedAbilities}
        initialSelectedOthers={selectedOthers}
        initialShowHiddenCharas={showHiddenCharas}
        onSearchChange={handleSearchChange}
        onRaceChange={handleRaceChange}
        onJobChange={handleJobChange}
        onFeatChange={handleFeatChange}
        onAbilityChange={handleAbilityChange}
        onOtherChange={handleOtherChange}
        onClearAllFilters={handleClearAllFilters}
      />
      <AdvancedSearchPanel
        state={advancedSearchState}
        fields={advancedSearchFields}
        onChange={handleAdvancedSearchChange}
      />
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <span>{t.common.columnPreset}:</span>
        <ToggleButton
          value="all"
          selected={selectedPresets.length === 0}
          onChange={handleShowAllColumns}
          size="small"
        >
          {t.common.presetAll}
        </ToggleButton>
        <ToggleButtonGroup
          value={selectedPresets}
          onChange={handlePresetChange}
          size="small"
        >
          <ToggleButton value="keyInfo">{t.common.presetKeyInfo}</ToggleButton>
          <ToggleButton value="primaryAttributes">
            {t.common.presetPrimaryAttributes}
          </ToggleButton>
          <ToggleButton value="skills">{t.common.presetSkills}</ToggleButton>
          <ToggleButton value="otherStats">
            {t.common.presetOtherStats}
          </ToggleButton>
          <ToggleButton value="resistances">
            {t.common.presetResistances}
          </ToggleButton>
          <ToggleButton value="tactics">{t.common.presetTactics}</ToggleButton>
          <ToggleButton value="rawData">{t.common.presetRawData}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={effectiveVisibilityModel}
          onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
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
                  selectedOthers,
                  newValue,
                  advancedSearchState
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
