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
import { Link as MuiLink, Paper, Box } from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import { Feat } from '@/lib/models/feat';

interface DataGridFeatTableProps {
  feats: Feat[];
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

export default function DataGridFeatTable({ feats }: DataGridFeatTableProps) {
  const { t, language } = useTranslation();
  const params = useParams();
  const lang = params.lang as string;
  const version = params.version as string;

  // Convert Feat objects to DataGrid rows
  const rows: GridRowsProp = useMemo(() => {
    return feats.map((feat) => {
      return {
        id: feat.alias,
        alias: feat.alias,
        name: feat.name(language),
        geneSlot: feat.getGeneSlot(),
        max: feat.getMax(),
        canDropAsGene: feat.canDropAsGene(),
        textExtra: feat.textExtra(language) || '',
      };
    });
  }, [feats, language]);

  // Define columns
  const columns: GridColDef[] = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: t.common.name,
        width: 300,
        renderCell: (params) => (
          <MuiLink
            component={Link}
            href={`/${lang}/${version}/feats/${params.row.alias}`}
            underline="hover"
          >
            {params.value}
          </MuiLink>
        ),
      },
      {
        field: 'geneSlot',
        headerName: t.feat.geneSlot,
        type: 'number',
        width: 120,
        renderCell: (params) => (params.value === -1 ? '-' : params.value),
      },
      {
        field: 'max',
        headerName: t.feat.max,
        type: 'number',
        width: 100,
      },
      {
        field: 'canDropAsGene',
        headerName: t.feat.canDropAsGene,
        type: 'boolean',
        width: 150,
        renderCell: (params) => (params.value ? t.feat.yes : t.feat.no),
      },
      {
        field: 'textExtra',
        headerName: t.feat.textExtra,
        width: 400,
        flex: 1,
      },
    ];
  }, [t, lang, version]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
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
