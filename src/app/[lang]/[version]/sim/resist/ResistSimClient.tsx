'use client';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Shield as ShieldIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useMemo, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type CharaRow, Chara } from '@/lib/models/chara';
import { resistanceElements } from '@/lib/models/element';
import AttackElementSelector from './AttackElementSelector';
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

  // Initialize from URL parameters
  useEffect(() => {
    const attackElementsParam = searchParams.get('attackElements');
    if (attackElementsParam) {
      try {
        const parsed = JSON.parse(attackElementsParam) as AttackElement[];
        setSelectedElements(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [searchParams]);

  // Update URL when elements change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedElements.length > 0) {
      params.set('attackElements', JSON.stringify(selectedElements));
    }

    const newUrl = params.toString()
      ? `/${lang}/${version}/sim/resist?${params.toString()}`
      : `/${lang}/${version}/sim/resist`;

    router.replace(newUrl, { scroll: false });
  }, [selectedElements, lang, version, router]);

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
    if (selectedElements.length === 0) {
      return allCharas;
    }

    return allCharas.filter((chara) => {
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
  }, [allCharas, selectedElements]);

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
  }, [t, lang, version, language, resistanceElementsList]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShieldIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.resistSim.title}
          </Typography>
        </Box>

        <AttackElementSelector
          selectedElements={selectedElements}
          onElementsChange={setSelectedElements}
        />

        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedElements.length === 0
              ? t.resistSim.allCharactersShown
              : t.resistSim.charactersWithResistance}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCharas.length} / {allCharas.length}
          </Typography>
        </Paper>

        <Suspense fallback={<div>{t.common.loading}...</div>}>
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
