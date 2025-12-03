'use client';
import {
  Container,
  Typography,
  Box,
  Paper,
  alpha,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Shield as ShieldIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import {
  useMemo,
  useState,
  useEffect,
  Suspense,
  useCallback,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type CharaRow, Chara } from '@/lib/models/chara';
import { resistanceElements } from '@/lib/models/element';
import AttackElementSelector from './AttackElementSelector';
import ResistanceMatrix from './ResistanceMatrix';
import {
  type AttackElement,
  calculateEffectiveResistance,
  getResistanceAlias,
} from '@/lib/resistSimUtils';
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
import { Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';

interface ResistSimClientProps {
  charaRows: CharaRow[];
  lang: string;
  version: string;
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

function ResistSimContent({ charaRows, lang, version }: ResistSimClientProps) {
  const charas = useMemo(
    () => charaRows.map((row) => new Chara(row)),
    [charaRows]
  );
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedElements, setSelectedElements] = useState<AttackElement[]>([]);
  const [showUniqueCharas, setShowUniqueCharas] = useState(false);
  const attackElementSelectorRef = useRef<HTMLDivElement>(null);

  // Initialize from URL parameters
  // This effect synchronizes external state (URL params) with component state
  useEffect(() => {
    const attackElementsParam = searchParams.get('attackElements');
    if (attackElementsParam) {
      try {
        const parsed = JSON.parse(attackElementsParam) as AttackElement[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with external URL state
        setSelectedElements(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }
    const unique = searchParams.get('unique') === 'true';
    setShowUniqueCharas(unique);
  }, [searchParams]);

  // Update URL when elements change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedElements.length > 0) {
      params.set('attackElements', JSON.stringify(selectedElements));
    }
    if (showUniqueCharas) {
      params.set('unique', 'true');
    }

    const newUrl = params.toString()
      ? `/${lang}/${version}/sim/resist?${params.toString()}`
      : `/${lang}/${version}/sim/resist`;

    router.replace(newUrl, { scroll: false });
  }, [selectedElements, showUniqueCharas, lang, version, router]);

  // Expand characters with variants (memoized for performance)
  const allCharas = useMemo(() => {
    return charas.flatMap((chara) => {
      const variants = chara.variants();
      return variants.length > 0 ? variants : [chara];
    });
  }, [charas]);

  const resistanceElementsList = resistanceElements();

  // Filter charas based on selected attack elements
  const filteredCharas = useMemo(() => {
    let filtered = allCharas;

    // Filter by unique characters
    if (!showUniqueCharas) {
      filtered = filtered.filter((chara) => !chara.isUnique());
    }

    // Filter by resistance
    if (selectedElements.length === 0) {
      return filtered;
    }

    return filtered.filter((chara) => {
      // Check if chara has 1+ resistance level against ALL attack elements
      return selectedElements.every((attackElem) => {
        const resAlias = getResistanceAlias(attackElem.element);
        const baseResistance = chara.getElementPower(resAlias);
        const effectiveResistance = calculateEffectiveResistance(
          baseResistance,
          attackElem
        );
        return effectiveResistance >= 1;
      });
    });
  }, [allCharas, selectedElements, showUniqueCharas]);

  // Convert filtered charas to DataGrid rows
  const rows: GridRowsProp = useMemo(() => {
    return filteredCharas.map((chara) => {
      const row: Record<string, unknown> = {
        id: chara.id,
        name: chara.normalizedName(language),
      };

      // Add resistance columns
      resistanceElementsList.forEach((resElement) => {
        const resValue = chara.getElementPower(resElement.alias) || 0;
        row[resElement.alias] = resValue; // Store numeric value for sorting
        row[`${resElement.alias}_display`] =
          getResistanceDisplayValueCompact(resValue); // Store display value
      });

      return row;
    });
  }, [filteredCharas, language, resistanceElementsList]);

  // Get selected attack element aliases for highlighting
  const selectedAttackAliases = useMemo(() => {
    return new Set(
      selectedElements.map((elem) => getResistanceAlias(elem.element))
    );
  }, [selectedElements]);

  // Handle matrix cell click - convert resistance aliases to attack elements
  const handleMatrixCellClick = useCallback(
    (rowAlias: string, colAlias: string) => {
      // Convert resistance aliases (res*) to attack element aliases (ele*)
      const rowAttackAlias = rowAlias.replace(/^res/, 'ele');
      const colAttackAlias = colAlias.replace(/^res/, 'ele');

      const newElements: AttackElement[] = [];

      // Add row element
      newElements.push({
        element: rowAttackAlias,
        penetrationLevel: 0,
      });

      // Add column element if different from row (not diagonal)
      if (rowAlias !== colAlias) {
        newElements.push({
          element: colAttackAlias,
          penetrationLevel: 0,
        });
      }

      setSelectedElements(newElements);

      // Scroll to attack element selector
      attackElementSelectorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    },
    []
  );

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

    // Add resistance columns
    resistanceElementsList.forEach((resElement) => {
      const isSelected = selectedAttackAliases.has(resElement.alias);
      baseColumns.push({
        field: resElement.alias,
        headerName: resElement.name(language),
        type: 'number',
        width: 80,
        renderCell: (params) => {
          const displayValue = params.row[`${resElement.alias}_display`];
          return displayValue;
        },
        cellClassName: isSelected ? 'highlighted-cell' : undefined,
        headerClassName: isSelected ? 'highlighted-header' : undefined,
      });
    });

    return baseColumns;
  }, [
    t,
    lang,
    version,
    language,
    resistanceElementsList,
    selectedAttackAliases,
  ]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShieldIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.resistSim.title}
          </Typography>
        </Box>

        <ResistanceMatrix
          charas={allCharas}
          onCellClick={handleMatrixCellClick}
        />

        <Box ref={attackElementSelectorRef}>
          <AttackElementSelector
            selectedElements={selectedElements}
            onElementsChange={setSelectedElements}
          />
        </Box>

        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedElements.length === 0
              ? t.resistSim.allCharactersShown
              : t.resistSim.charactersWithResistance}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCharas.length} / {allCharas.length}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showUniqueCharas}
                  onChange={(e) => setShowUniqueCharas(e.target.checked)}
                />
              }
              label={t.common.showUniqueCharacters}
            />
          </Box>
        </Paper>

        <Suspense fallback={<div>{t.common.loading}...</div>}>
          <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
            <DataGrid
              key={JSON.stringify(selectedElements)}
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
                '& .highlighted-cell': {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.15),
                  },
                },
                '& .highlighted-header': {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.12),
                  fontWeight: 'bold',
                },
              }}
            />
          </Paper>
        </Suspense>
      </Box>
    </Container>
  );
}

export default function ResistSimClient(props: ResistSimClientProps) {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div>{t.common.loading}...</div>}>
      <ResistSimContent {...props} />
    </Suspense>
  );
}
