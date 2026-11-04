'use client';

import { useState, FC } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  createRoomShellSlice,
  RoomShell,
  RoomShellSliceState,
  RoomPanel,
} from '@sqlrooms/room-shell';
import {
  createRoomStore,
  StateCreator,
  useBaseRoomStore,
} from '@sqlrooms/room-store';
import {
  Button,
  Tabs,
  TabsContent,
  ThemeProvider as SqlRoomsThemeProvider,
  useToast,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@sqlrooms/ui';
import {
  createDefaultSqlEditorConfig,
  createSqlEditorSlice,
  SqlEditorSliceState,
  QueryEditorPanelActions,
  QueryEditorPanelEditor,
  QueryEditorPanelTabsList,
  QueryResultPanel,
  TableStructurePanel,
} from '@sqlrooms/sql-editor';
import { LayoutTypes } from '@sqlrooms/layout-config';
import { Database, Link as LinkIcon } from 'lucide-react';
import type { UrlDataSource } from '@sqlrooms/room-config';
import { useTranslation } from '@/lib/simple-i18n';

interface SqlRoomContainerProps {
  versionLabel: string;
  tableNames: string[];
  csvBasePath: string;
}

type RoomState = RoomShellSliceState & SqlEditorSliceState;

const buildShareUrl = (query: string): string => {
  const { origin, pathname } = window.location;
  if (query.trim() === '') {
    return `${origin}${pathname}`;
  }
  const params = new URLSearchParams({ sql: query });
  return `${origin}${pathname}?${params.toString()}`;
};

const ShareQueryButton: FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const getCurrentQuery = useBaseRoomStore<RoomState, () => string>(
    (s) => s.sqlEditor.getCurrentQuery
  );

  const handleClick = () => {
    Promise.resolve()
      .then(() =>
        navigator.clipboard.writeText(buildShareUrl(getCurrentQuery()))
      )
      .then(
        () => toast({ title: t.sources.shareQueryCopied }),
        () =>
          toast({ title: t.sources.shareQueryFailed, variant: 'destructive' })
      );
  };

  return (
    <Button
      className="text-foreground flex h-6 items-center justify-center gap-1 px-3"
      variant="outline"
      size="xs"
      onClick={handleClick}
    >
      <LinkIcon className="h-3 w-3" />
      <span>{t.sources.shareQuery}</span>
    </Button>
  );
};

const ShareableQueryEditorPanel: FC = () => {
  const selectedQueryId = useBaseRoomStore<RoomState, string>(
    (s) => s.sqlEditor.config.selectedQueryId
  );
  const queries = useBaseRoomStore<
    RoomState,
    RoomState['sqlEditor']['config']['queries']
  >((s) => s.sqlEditor.config.queries);
  const setSelectedQueryId = useBaseRoomStore<
    RoomState,
    (queryId: string) => void
  >((s) => s.sqlEditor.setSelectedQueryId);

  return (
    <Tabs
      value={selectedQueryId}
      onValueChange={setSelectedQueryId}
      // Monaco の補完メニューが切れないように overflow-visible にする
      className="flex h-full flex-col overflow-visible"
    >
      <div className="border-border flex items-center gap-4 border-b px-2 pt-1">
        <QueryEditorPanelTabsList />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <ShareQueryButton />
          <QueryEditorPanelActions />
        </div>
      </div>
      {queries.map((q) => (
        <TabsContent
          key={q.id}
          value={q.id}
          className="relative h-full flex-grow flex-col data-[state=active]:flex"
        >
          <div className="absolute inset-0 h-full w-full flex-grow">
            {q.id === selectedQueryId && (
              <QueryEditorPanelEditor queryId={q.id} />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

const MainView: FC = () => {
  return (
    <div className="bg-muted flex h-full flex-col">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>
          <ShareableQueryEditorPanel />
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
  versionLabel: string,
  tableNames: string[],
  csvBasePath: string,
  sharedSql: string | null
) {
  const dataSources: UrlDataSource[] = tableNames.map((tableName) => ({
    tableName,
    type: 'url' as const,
    url: `${csvBasePath}/${tableName}.csv`,
  }));

  const sqlEditorConfig = sharedSql
    ? {
        ...createDefaultSqlEditorConfig(),
        queries: [{ id: 'default', name: 'SQL', query: sharedSql }],
      }
    : undefined;

  const stateCreator: StateCreator<RoomState> = (set, get, store) => ({
    ...createRoomShellSlice({
      config: {
        title: `Elin Source Search (${versionLabel})`,
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
    ...createSqlEditorSlice({ config: sqlEditorConfig })(set, get, store),
    initialize: async () => {
      if (sharedSql) {
        // room.initialize() はこの関数が返るまで読み込み中のモーダルを閉じないので、
        // await するとクエリが終わるまで Cancel を押せない
        void get().sqlEditor.parseAndRunCurrentQuery();
      }
    },
  });

  const { roomStore } = createRoomStore<RoomState>(stateCreator);
  return roomStore;
}

export default function SqlRoomContainer({
  versionLabel,
  tableNames,
  csvBasePath,
}: SqlRoomContainerProps) {
  const searchParams = useSearchParams();
  const [roomStore] = useState(() =>
    createStore(versionLabel, tableNames, csvBasePath, searchParams.get('sql'))
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
