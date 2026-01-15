'use client';

import { useState, FC } from 'react';
import {
  createRoomShellSlice,
  RoomShell,
  RoomShellSliceState,
  RoomPanel,
} from '@sqlrooms/room-shell';
import { createRoomStore, StateCreator } from '@sqlrooms/room-store';
import {
  ThemeProvider as SqlRoomsThemeProvider,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@sqlrooms/ui';
import {
  createSqlEditorSlice,
  SqlEditorSliceState,
  QueryEditorPanel,
  QueryResultPanel,
  TableStructurePanel,
} from '@sqlrooms/sql-editor';
import { LayoutTypes } from '@sqlrooms/layout-config';
import { Database } from 'lucide-react';
import { GameVersion } from '@/lib/db';
import type { UrlDataSource } from '@sqlrooms/room-config';

interface SqlRoomContainerProps {
  version: GameVersion;
  tableNames: string[];
  csvBasePath: string;
}

type RoomState = RoomShellSliceState & SqlEditorSliceState;

const MainView: FC = () => {
  return (
    <div className="bg-muted flex h-full flex-col">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>
          <QueryEditorPanel />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <QueryResultPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

const DataPanel: FC = () => {
  return (
    <RoomPanel type="data">
      <TableStructurePanel />
    </RoomPanel>
  );
};

function createStore(
  version: GameVersion,
  tableNames: string[],
  csvBasePath: string
) {
  const dataSources: UrlDataSource[] = tableNames.map((tableName) => ({
    tableName,
    type: 'url' as const,
    url: `${csvBasePath}/${tableName}.csv`,
  }));

  const stateCreator: StateCreator<RoomState> = (set, get, store) => ({
    ...createRoomShellSlice({
      config: {
        title: `Elin Source Search (${version})`,
        dataSources,
      },
      layout: {
        config: {
          type: LayoutTypes.enum.mosaic,
          nodes: {
            first: 'data',
            second: 'main',
            direction: 'row',
            splitPercentage: 30,
          },
        },
        panels: {
          main: {
            component: MainView,
            placement: 'main',
          },
          data: {
            title: 'Data',
            component: DataPanel,
            icon: Database,
            placement: 'sidebar',
          },
        },
      },
    })(set, get, store),
    ...createSqlEditorSlice()(set, get, store),
  });

  const { roomStore } = createRoomStore<RoomState>(stateCreator);
  return roomStore;
}

export default function SqlRoomContainer({
  version,
  tableNames,
  csvBasePath,
}: SqlRoomContainerProps) {
  const [roomStore] = useState(() =>
    createStore(version, tableNames, csvBasePath)
  );

  return (
    <SqlRoomsThemeProvider
      defaultTheme="light"
      storageKey="elin-sqlrooms-theme"
    >
      <RoomShell className="h-full" roomStore={roomStore}>
        <RoomShell.LayoutComposer />
        <RoomShell.LoadingProgress />
      </RoomShell>
    </SqlRoomsThemeProvider>
  );
}
