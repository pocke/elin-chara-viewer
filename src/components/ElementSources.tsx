'use client';
import { ReactNode, useState } from 'react';
import { Box, ClickAwayListener, Tooltip, Typography } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import {
  ElementSource,
  ElementSourceOrigin,
  ElementWithPower,
} from '@/lib/elementable';

const ORIGIN_DISPLAY_ORDER: Record<ElementSourceOrigin['kind'], number> = {
  race: 0,
  job: 1,
  chara: 2,
};

export const elementTooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: 'background.paper',
      color: 'text.primary',
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 2,
      '& .MuiTooltip-arrow': {
        color: 'background.paper',
        '&::before': {
          border: '1px solid',
          borderColor: 'divider',
        },
      },
    },
  },
};

const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

interface ElementSourceLinesProps {
  sources: ElementSource[];
  mode: 'power' | 'potential';
  locale: string;
}

export function ElementSourceLines({
  sources,
  mode,
  locale,
}: ElementSourceLinesProps) {
  const { t } = useTranslation();
  const withParen = (outer: string, inner: string): string =>
    t.common.elementSourceParen
      .replace('{{outer}}', outer)
      .replace('{{inner}}', inner);
  const originLabel = (origin: ElementSourceOrigin): string => {
    switch (origin.kind) {
      case 'chara':
        return t.common.elementSourceChara;
      case 'race':
        return withParen(origin.race.name(locale), t.common.race);
      case 'job':
        return withParen(origin.job.name(locale), t.common.job);
    }
  };
  const orderedSources = [...sources].sort(
    (a, b) =>
      ORIGIN_DISPLAY_ORDER[a.origin.kind] - ORIGIN_DISPLAY_ORDER[b.origin.kind]
  );

  const valueText = (power: number): string => {
    if (mode === 'power') {
      return signed(power);
    }
    return power === 1 ? t.common.skillLearned : signed(power * 10);
  };

  return (
    <>
      {mode === 'potential' && (
        <Typography variant="body2">
          {t.common.skillBasePotential} 100
        </Typography>
      )}
      {orderedSources.map((source, index) => {
        const origin = originLabel(source.origin);
        const label = source.via
          ? withParen(source.via.name(locale), origin)
          : origin;
        return (
          <Typography
            variant="body2"
            key={index}
            color={source.power < 0 ? 'error' : undefined}
          >
            {label} {valueText(source.power)}
          </Typography>
        );
      })}
    </>
  );
}

export function ElementSourceSection(props: ElementSourceLinesProps) {
  const { t } = useTranslation();
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {t.common.elementSources}
      </Typography>
      <ElementSourceLines {...props} />
    </Box>
  );
}

interface SourcedValueProps {
  elementWithPower: ElementWithPower | undefined;
  locale: string;
  children: ReactNode;
}

export function SourcedValue({
  elementWithPower,
  locale,
  children,
}: SourcedValueProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [tapOpen, setTapOpen] = useState(false);

  if (!elementWithPower || elementWithPower.sources.length === 0) {
    return <Typography variant="h6">{children}</Typography>;
  }

  return (
    <Typography variant="h6">
      {/* MUI opens tooltips on touch only after a 700ms long press and calls
          onClose leaveTouchDelay after touchend, so the tap-opened state is
          kept outside onOpen/onClose. */}
      <ClickAwayListener
        onClickAway={() => setTapOpen(false)}
        mouseEvent={tapOpen ? 'onClick' : false}
        touchEvent={tapOpen ? 'onTouchEnd' : false}
      >
        <Tooltip
          title={
            <ElementSourceLines
              sources={elementWithPower.sources}
              mode="power"
              locale={locale}
            />
          }
          open={hoverOpen || tapOpen}
          onOpen={() => setHoverOpen(true)}
          onClose={(event) => {
            setHoverOpen(false);
            if (event.type === 'keydown') {
              setTapOpen(false);
            }
          }}
          arrow
          placement="top"
          slotProps={elementTooltipSlotProps}
        >
          <Box
            component="span"
            onPointerUp={(event) => {
              if (event.pointerType !== 'mouse') {
                setTapOpen((open) => !open);
              }
            }}
            sx={{
              borderBottom: '1px dotted',
              cursor: 'help',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
          >
            {children}
          </Box>
        </Tooltip>
      </ClickAwayListener>
    </Typography>
  );
}
