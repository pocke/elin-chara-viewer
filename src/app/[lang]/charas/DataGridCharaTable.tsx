'use client';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
} from '@mui/x-data-grid';
import { Link as MuiLink, Tooltip, Paper } from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import { Chara } from '@/lib/models/chara';
import { resistanceElements } from '@/lib/models/element';
import { getResistanceDisplayValueCompact } from '@/lib/resistanceUtils';

interface DataGridCharaTableProps {
  charas: Chara[];
  showStatusColumns: boolean;
  showResistances: boolean;
}

export default function DataGridCharaTable({
  charas,
  showStatusColumns,
  showResistances,
}: DataGridCharaTableProps) {
  const { t, language } = useTranslation();
  const params = useParams();
  const lang = params.lang as string;
  const resistanceElementsList = resistanceElements();

  // Convert Chara objects to DataGrid rows
  // Get unique race and job options for select filters
  const { raceOptions, jobOptions } = useMemo(() => {
    const raceSet = new Set<string>();
    const jobSet = new Set<string>();

    charas.forEach((chara) => {
      raceSet.add(chara.race.name(language));
      jobSet.add(chara.job().name(language));
    });

    return {
      raceOptions: Array.from(raceSet).sort(),
      jobOptions: Array.from(jobSet).sort(),
    };
  }, [charas, language]);

  const rows: GridRowsProp = useMemo(() => {
    return charas.map((chara) => {
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

      // Add status columns if shown
      if (showStatusColumns) {
        row.life = chara.life();
        row.mana = chara.mana();
        row.speed = chara.speed();
        row.vigor = chara.vigor();
        row.dv = chara.dv();
        row.pv = chara.pv();
        row.pdr = chara.pdr();
        row.edr = chara.edr();
        row.ep = chara.ep();
      }

      // Add resistance columns if shown
      if (showResistances) {
        resistanceElementsList.forEach((resElement) => {
          const resValue = chara.getElementPower(resElement.alias) || 0;
          row[resElement.alias] = getResistanceDisplayValueCompact(resValue);
        });
      }

      return row;
    });
  }, [
    charas,
    language,
    t,
    showStatusColumns,
    showResistances,
    resistanceElementsList,
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
            href={`/${lang}/charas/${params.row.id}`}
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

    // Add status columns if shown
    if (showStatusColumns) {
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
          headerName: t.common.pdrShort,
          type: 'number',
          width: 60,
        },
        {
          field: 'edr',
          headerName: t.common.edrShort,
          type: 'number',
          width: 60,
        },
        {
          field: 'ep',
          headerName: t.common.epShort,
          type: 'number',
          width: 60,
        }
      );
    }

    // Add resistance columns if shown
    if (showResistances) {
      resistanceElementsList.forEach((resElement) => {
        baseColumns.push({
          field: resElement.alias,
          headerName: resElement.name(language),
          width: 80,
        });
      });
    }

    return baseColumns;
  }, [
    t,
    lang,
    language,
    showStatusColumns,
    showResistances,
    resistanceElementsList,
    raceOptions,
    jobOptions,
  ]);

  return (
    <Paper elevation={1} sx={{ height: '70vh', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        initialState={{
          sorting: {
            sortModel: [{ field: 'level', sort: 'desc' }],
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
  );
}
