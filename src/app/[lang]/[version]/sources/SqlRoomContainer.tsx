'use client';

import { useMemo } from 'react';
import {
  createRoomShellSlice,
  RoomShell,
  RoomShellSliceState,
  TablesListPanel,
} from '@sqlrooms/room-shell';
import { createRoomStore, StateCreator } from '@sqlrooms/room-store';
import { ThemeProvider as SqlRoomsThemeProvider } from '@sqlrooms/ui';
import {
  createSqlEditorSlice,
  SqlEditorSliceState,
  QueryEditorPanel,
  QueryResultPanel,
} from '@sqlrooms/sql-editor';
import { Database, Code, Table } from 'lucide-react';
import { GameVersion } from '@/lib/db';
import type { UrlDataSource } from '@sqlrooms/room-config';

interface SqlRoomContainerProps {
  version: GameVersion;
  tableNames: string[];
  csvBasePath: string;
}

type RoomState = RoomShellSliceState & SqlEditorSliceState;

export default function SqlRoomContainer({
  version,
  tableNames,
  csvBasePath,
}: SqlRoomContainerProps) {
  const dataSources: UrlDataSource[] = useMemo(() => {
    return tableNames.map((tableName) => ({
      tableName,
      type: 'url' as const,
      url: `${csvBasePath}/${tableName}.csv`,
    }));
  }, [tableNames, csvBasePath]);

  const roomStore = useMemo(() => {
    const stateCreator: StateCreator<RoomState> = (set, get, store) => ({
      ...createRoomShellSlice({
        config: {
          title: `Elin Source Search (${version})`,
          dataSources,
        },
        layout: {
          panels: {
            'tables-list': {
              title: 'Tables',
              icon: Database,
              component: TablesListPanel,
              placement: 'sidebar',
            },
            'sql-editor': {
              title: 'SQL Editor',
              icon: Code,
              component: QueryEditorPanel,
              placement: 'main',
            },
            'query-result': {
              title: 'Query Result',
              icon: Table,
              component: QueryResultPanel,
              placement: 'main',
            },
          },
          config: {
            type: 'mosaic',
            nodes: {
              direction: 'column',
              first: 'sql-editor',
              second: 'query-result',
              splitPercentage: 40,
            },
            pinned: ['tables-list'],
          },
        },
      })(set, get, store),
      ...createSqlEditorSlice()(set, get, store),
    });
    const { roomStore } = createRoomStore<RoomState>(stateCreator);
    return roomStore;
  }, [version, dataSources]);

  return (
    <SqlRoomsThemeProvider
      defaultTheme="light"
      storageKey="elin-sqlrooms-theme"
    >
      <RoomShell className="h-full" roomStore={roomStore}>
        <RoomShell.Sidebar />
        <RoomShell.LayoutComposer />
        <RoomShell.LoadingProgress />
      </RoomShell>
    </SqlRoomsThemeProvider>
  );
}
