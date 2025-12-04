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
import { Link as MuiLink, Paper, Box, Chip } from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import { Feat } from '@/lib/models/feat';
import { GameVersion } from '@/lib/db';
import { racesByFeat } from '@/lib/models/race';
import { jobsByFeat } from '@/lib/models/job';

interface DataGridFeatTableProps {
  feats: Feat[];
  version: GameVersion;
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

export default function DataGridFeatTable({
  feats,
  version,
}: DataGridFeatTableProps) {
  const { t, language } = useTranslation();
  const params = useParams();
  const lang = params.lang as string;

  // Convert Feat objects to DataGrid rows
  const rows: GridRowsProp = useMemo(() => {
    return feats.map((feat) => {
      const races = racesByFeat(version, feat.alias);
      const jobs = jobsByFeat(version, feat.alias);

      return {
        id: feat.alias,
        alias: feat.alias,
        name: feat.name(language),
        races: races,
        jobs: jobs,
        racesForSort: races.length > 0 ? races[0].name(language) : '',
        jobsForSort: jobs.length > 0 ? jobs[0].name(language) : '',
        geneSlot: feat.getGeneSlot(),
        max: feat.getMax(),
        cost: feat.cost(),
        canDropAsGene: feat.canDropAsGene(),
        textExtra: feat.textExtra(language) || '',
      };
    });
  }, [feats, language, version]);

  // Define columns
  const columns: GridColDef[] = useMemo(() => {
    return [
      {
        field: 'name',
        headerName: t.common.name,
        width: 250,
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
        field: 'cost',
        headerName: t.feat.cost,
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
        field: 'races',
        headerName: t.common.race,
        width: 250,
        valueGetter: (_value, row) => row.racesForSort,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5, py: 0.5 }}>
            {params.row.races.map(
              (race: { id: string; name: (lang: string) => string }) => (
                <Chip
                  key={race.id}
                  label={race.name(language)}
                  size="small"
                  variant="outlined"
                />
              )
            )}
          </Box>
        ),
      },
      {
        field: 'jobs',
        headerName: t.common.job,
        width: 250,
        valueGetter: (_value, row) => row.jobsForSort,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5, py: 0.5 }}>
            {params.row.jobs.map(
              (job: { id: string; name: (lang: string) => string }) => (
                <Chip
                  key={job.id}
                  label={job.name(language)}
                  size="small"
                  variant="outlined"
                />
              )
            )}
          </Box>
        ),
      },
      {
        field: 'textExtra',
        headerName: t.feat.textExtra,
        width: 400,
        flex: 1,
      },
    ];
  }, [t, lang, version, language]);

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
