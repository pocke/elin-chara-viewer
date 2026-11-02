'use client';
import { ReactNode } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import { ElementSource, ElementWithPower } from '@/lib/elementable';

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
  const originLabels = {
    chara: t.common.elementSourceChara,
    race: t.common.race,
    job: t.common.job,
  };

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
      {sources.map((source, index) => {
        const origin = originLabels[source.origin];
        const label = source.via
          ? `${source.via.name(locale)} (${origin})`
          : origin;
        return (
          <Typography variant="body2" key={index}>
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
  if (!elementWithPower || elementWithPower.sources.length === 0) {
    return <Typography variant="h6">{children}</Typography>;
  }

  return (
    <Typography variant="h6">
      <Tooltip
        title={
          <ElementSourceLines
            sources={elementWithPower.sources}
            mode="power"
            locale={locale}
          />
        }
        arrow
        placement="top"
        slotProps={elementTooltipSlotProps}
      >
        <Box
          component="span"
          sx={{ borderBottom: '1px dotted', cursor: 'help' }}
        >
          {children}
        </Box>
      </Tooltip>
    </Typography>
  );
}
