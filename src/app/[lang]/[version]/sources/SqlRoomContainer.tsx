'use client';

import { useMemo } from 'react';
import {
  createRoomShellSlice,
  RoomShell,
  RoomShellSliceState,
} from '@sqlrooms/room-shell';
import { createRoomStore } from '@sqlrooms/room-store';
import { ThemeProvider as SqlRoomsThemeProvider } from '@sqlrooms/ui';
import { GameVersion } from '@/lib/db';
import type { UrlDataSource } from '@sqlrooms/room-config';

import './sqlrooms.css';

interface SqlRoomContainerProps {
  version: GameVersion;
  tableNames: string[];
  csvBasePath: string;
}

type RoomState = RoomShellSliceState;

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
    const { roomStore } = createRoomStore<RoomState>((set, get, store) => ({
      ...createRoomShellSlice({
        config: {
          title: `Elin Source Search (${version})`,
          dataSources,
        },
      })(set, get, store),
    }));
    return roomStore;
  }, [version, dataSources]);

  return (
    <SqlRoomsThemeProvider
      defaultTheme="light"
      storageKey="elin-sqlrooms-theme"
    >
      <RoomShell className="tw-h-full" roomStore={roomStore}>
        <RoomShell.Sidebar />
        <RoomShell.LayoutComposer />
        <RoomShell.LoadingProgress />
      </RoomShell>
    </SqlRoomsThemeProvider>
  );
}
