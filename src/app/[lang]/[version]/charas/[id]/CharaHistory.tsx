'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
import RelativeDate from '@/components/RelativeDate';
import { GameVersion } from '@/lib/db';
import { basePotential, sumPowers } from '@/lib/elementable';
import { charaHistory } from '@/lib/history/fetch';
import {
  AbilityValue,
  CharaHistory as CharaHistoryFile,
  ChangeValue,
  HistoryEntry,
  RawChange,
  ValueChange,
} from '@/lib/history/types';
import { elementByAlias } from '@/lib/models/element';
import { Translations, useTranslation } from '@/lib/simple-i18n';
import { compareVersionNames } from '@/lib/versionOrder';

interface CharaHistoryProps {
  charaKey: string;
  version: GameVersion;
  /** As the game spells it, so that it can be ordered against the entries. */
  versionName: string;
}

const BODY_PART_LABELS: Record<string, (t: Translations) => string> = {
  hand: (t) => t.common.hand,
  head: (t) => t.common.head,
  torso: (t) => t.common.torso,
  back: (t) => t.common.back,
  waist: (t) => t.common.waist,
  arm: (t) => t.common.arm,
  foot: (t) => t.common.foot,
  neck: (t) => t.common.neck,
  finger: (t) => t.common.finger,
};

// The only group whose members do not name themselves: "taunt" and "range" say
// nothing about being a tactic, so they carry the group in the label.
const TACTICS_LABELS: Record<string, (t: Translations) => string> = {
  id: () => 'ID',
  nameJa: (t) => `${t.common.name} (JA)`,
  nameEn: (t) => `${t.common.name} (EN)`,
  distance: (t) => t.common.tacticsDistance,
  moveFrequency: (t) => t.common.tacticsMoveFrequency,
  party: (t) => t.common.tacticsParty,
  taunt: (t) => t.common.tacticsTaunt,
  melee: (t) => t.common.tacticsMelee,
  range: (t) => t.common.tacticsRange,
  spell: (t) => t.common.tacticsSpell,
  heal: (t) => t.common.tacticsHeal,
  summon: (t) => t.common.tacticsSummon,
  buff: (t) => t.common.tacticsBuff,
  debuff: (t) => t.common.tacticsDebuff,
  partyBuff: (t) => t.common.tacticsPartyBuff,
};

const SUB_SUFFIX: Record<string, string> = {
  id: ' (ID)',
  nameJa: ' (JA)',
  nameEn: ' (EN)',
};

interface HistoryResult {
  attempt: number;
  charaKey: string;
  history: CharaHistoryFile | null;
  failed: boolean;
}

interface ChangeRow {
  label: string;
  before: string;
  after: string;
  delta: number | null;
}

/**
 * A raw column holds text, and nothing says it holds a quantity. Both sides
 * have to be numbers before the difference between them means anything: an
 * empty tiles_snow becoming 715 is a tile it now has, not a rise of 715.
 */
const rawDelta = (from: string | null, to: string | null): number | null => {
  const asNumber = (value: string | null): number | null =>
    value !== null && /^-?\d+(\.\d+)?$/.test(value.trim())
      ? Number(value)
      : null;

  const before = asNumber(from);
  const after = asNumber(to);
  if (before === null || after === null || before === after) return null;
  return after - before;
};

const isAbility = (value: ChangeValue): value is AbilityValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export default function CharaHistory({
  charaKey,
  version,
  versionName,
}: CharaHistoryProps) {
  const { t, language } = useTranslation();
  const lang = useParams().lang as string;
  // Counts requests rather than recording that one was made, so that the retry
  // button has something to change. Zero means the accordion is still shut.
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (attempt === 0) return;
    let cancelled = false;

    charaHistory(charaKey)
      .then((history) => {
        if (!cancelled)
          setResult({ attempt, charaKey, history, failed: false });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled)
          setResult({ attempt, charaKey, history: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, charaKey]);

  // Carrying what it answers lets a result from the previous character, or from
  // an attempt the reader has already retried past, be ignored rather than
  // cleared -- which would mean writing state from the effect.
  const current =
    result?.attempt === attempt && result.charaKey === charaKey ? result : null;
  const loaded = current !== null;
  const failed = current?.failed ?? false;
  const history = current?.history ?? null;

  const entries = useMemo(
    () =>
      (history?.entries ?? []).filter(
        (entry) =>
          showRaw || entry.changes.length > 0 || entry.kind !== 'changed'
      ),
    [history, showRaw]
  );

  // The version being viewed has an entry only when it changed something, so
  // the line is drawn by name order rather than by looking it up.
  const newerCount = entries.filter(
    (entry) => compareVersionNames(entry.version, versionName) > 0
  ).length;

  const elementName = (alias: string): string => {
    const element = elementByAlias(version, alias);
    if (element) return element.name(language);
    const remembered = history?.names[alias];
    return remembered ? remembered[language] : alias;
  };

  const isSkill = (alias: string): boolean =>
    elementByAlias(version, alias)?.row.category === 'skill';

  const abilityName = (ability: AbilityValue): string => {
    const base = elementByAlias(version, ability.name);
    if (!base) return ability.name;
    const element = ability.element
      ? (elementByAlias(version, ability.element) ?? null)
      : null;
    return base.abilityName(element, language);
  };

  const labelOf = (change: ValueChange): string => {
    switch (change.field) {
      case 'name':
        return `${t.common.name} (${change.key === 'ja' ? 'JA' : 'EN'})`;
      case 'mainElement':
        return t.common.mainElement;
      case 'race':
        return `${t.common.race}${SUB_SUFFIX[change.key ?? ''] ?? ''}`;
      case 'job':
        return `${t.common.job}${SUB_SUFFIX[change.key ?? ''] ?? ''}`;
      case 'tactics': {
        const sub = TACTICS_LABELS[change.key ?? '']?.(t);
        return sub ? `${t.common.tactics}/${sub}` : t.common.tactics;
      }
      case 'level':
        return t.common.level;
      case 'geneSlot':
        return change.key === 'orig'
          ? `${t.common.geneSlot} (${t.common.historyGeneSlotBase})`
          : t.common.geneSlot;
      case 'bodyParts':
        return BODY_PART_LABELS[change.key ?? '']?.(t) ?? change.key ?? '';
      case 'elements': {
        const alias = change.key ?? '';
        return isSkill(alias)
          ? `${elementName(alias)} (${t.common.historyPotential})`
          : elementName(alias);
      }
      case 'abilities': {
        const ability = isAbility(change.to)
          ? change.to
          : isAbility(change.from)
            ? change.from
            : null;
        return ability ? abilityName(ability) : (change.key ?? '');
      }
    }
  };

  /** null where the value is not one a reader can subtract. */
  const numberOf = (change: ValueChange, value: ChangeValue): number | null => {
    if (typeof value === 'number') return value;
    if (Array.isArray(value)) {
      return isSkill(change.key ?? '')
        ? basePotential(value)
        : sumPowers(value);
    }
    if (isAbility(value)) return value.chance;
    return null;
  };

  const textOf = (change: ValueChange, value: ChangeValue): string => {
    if (value === null) return t.common.historyNoValue;
    if (typeof value === 'boolean') return value ? t.common.yes : t.common.no;
    if (change.field === 'mainElement' && typeof value === 'string') {
      return elementName(value);
    }
    if (isAbility(value)) {
      return `${value.chance}%${value.party ? ` (${t.common.range})` : ''}`;
    }
    const asNumber = numberOf(change, value);
    return asNumber === null ? String(value) : String(asNumber);
  };

  /**
   * A value that was not there counts as zero against one that is a number, so
   * that gaining a resistance of 15 reads as +15 rather than as nothing. An
   * ability is not a quantity that way, and is left out.
   */
  const deltaOf = (change: ValueChange): number | null => {
    if (isAbility(change.from) !== isAbility(change.to)) return null;

    const from =
      numberOf(change, change.from) ?? (change.from === null ? 0 : null);
    const to = numberOf(change, change.to) ?? (change.to === null ? 0 : null);
    if (from === null || to === null || from === to) return null;
    return to - from;
  };

  // The base is the race's own gene capacity, the other what the feats leave of
  // it, so the two move together unless a feat moved as well. Only the times
  // they disagree say anything the effective row does not already.
  const withoutEchoedGeneSlotBase = (changes: ValueChange[]): ValueChange[] => {
    const base = changes.find(
      (change) => change.field === 'geneSlot' && change.key === 'orig'
    );
    const actual = changes.find(
      (change) => change.field === 'geneSlot' && change.key === 'actual'
    );
    if (!base || !actual || deltaOf(base) !== deltaOf(actual)) return changes;
    return changes.filter((change) => change !== base);
  };

  const renderTable = (rows: ChangeRow[]) => (
    <Table size="small" sx={{ mt: 0.5 }}>
      <TableHead>
        <TableRow>
          <TableCell>{t.common.historyField}</TableCell>
          <TableCell align="right">{t.common.historyBefore}</TableCell>
          <TableCell align="right">{t.common.historyAfter}</TableCell>
          <TableCell align="right">{t.common.historyDelta}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            <TableCell>{row.label}</TableCell>
            <TableCell align="right" sx={{ color: 'text.secondary' }}>
              {row.before}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              {row.after}
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color:
                  row.delta === null
                    ? 'text.secondary'
                    : row.delta > 0
                      ? 'success.main'
                      : 'error.main',
              }}
            >
              {row.delta === null
                ? ''
                : `${row.delta > 0 ? '+' : ''}${row.delta}`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const changeRows = (changes: ValueChange[]): ChangeRow[] =>
    withoutEchoedGeneSlotBase(changes).map((change) => ({
      label: labelOf(change),
      before: textOf(change, change.from),
      after: textOf(change, change.to),
      delta: deltaOf(change),
    }));

  const rawRows = (changes: RawChange[]): ChangeRow[] =>
    changes.map((change) => ({
      label: `${change.table}.${change.column}${
        change.swapped ? ` (${t.common.historyReferenceSwapped})` : ''
      }`,
      before: change.from === null ? t.common.historyNoValue : change.from,
      after: change.to === null ? t.common.historyNoValue : change.to,
      delta: rawDelta(change.from, change.to),
    }));

  const renderEntry = (entry: HistoryEntry) => {
    // One table: a raw column names itself as `table.column`, which is already
    // what tells it apart from a display field.
    const rows = [
      ...changeRows(entry.changes),
      ...(showRaw ? rawRows(entry.raw) : []),
    ];

    const kindLabel: Partial<Record<HistoryEntry['kind'], string>> = {
      origin: t.common.historyOrigin,
      added: history?.isVariant
        ? t.common.historyVariantAdded
        : t.common.historyAdded,
      removed: history?.isVariant
        ? t.common.historyVariantRemoved
        : t.common.historyRemoved,
      unavailable: t.common.historyUnavailable,
    };

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="subtitle2">
            {entry.kind === 'removed' ? (
              entry.version
            ) : (
              <Link href={`/${lang}/${entry.slug}/charas/${charaKey}`}>
                {entry.version}
              </Link>
            )}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={
              entry.channel === 'stable'
                ? t.common.channelStable
                : t.common.channelNightly
            }
          />
          <Typography variant="caption" color="text.secondary">
            <RelativeDate date={entry.releaseDate} />
          </Typography>
          {kindLabel[entry.kind] && (
            <Chip size="small" color="primary" label={kindLabel[entry.kind]} />
          )}
        </Box>

        {entry.reason && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
            {entry.reason}
          </Typography>
        )}

        {rows.length > 0 && renderTable(rows)}
      </Box>
    );
  };

  const viewingDivider =
    newerCount > 0 ? (
      <Divider sx={{ mb: 2 }}>
        <Chip
          size="small"
          label={`${t.common.historyViewing}: ${versionName}`}
        />
      </Divider>
    ) : null;

  return (
    <Accordion
      onChange={(_, expanded) =>
        expanded && setAttempt((made) => (made === 0 ? 1 : made))
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" color="text.secondary">
          {t.common.history}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {failed && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setAttempt((made) => made + 1)}
              >
                {t.common.retry}
              </Button>
            }
          >
            {t.common.historyLoadFailed}
          </Alert>
        )}

        {!failed && !loaded && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* No file at all reads differently from a file that records no
            change: the archive is rebuilt after the deploy that reads it, so
            "nothing changed" would be a lie during that window. */}
        {!failed && loaded && !history && (
          <Typography variant="body2" color="text.secondary">
            {t.common.historyUnavailableYet}
          </Typography>
        )}

        {!failed && loaded && history && (
          <>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showRaw}
                  onChange={(event) => setShowRaw(event.target.checked)}
                />
              }
              label={t.common.historyShowRaw}
            />

            <Box sx={{ mt: 1 }}>
              {entries.map((entry, index) => (
                <Fragment key={entry.slug}>
                  {index === newerCount && viewingDivider}
                  {renderEntry(entry)}
                </Fragment>
              ))}
              {newerCount === entries.length && viewingDivider}
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
