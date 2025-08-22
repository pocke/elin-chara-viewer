'use client';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Chara, type CharaRow } from '@/lib/models/chara';
import {
  ElementAttacks,
  elementByAlias,
  resistanceElements,
  Element,
} from '@/lib/models/element';
import { Race, type RaceRow } from '@/lib/models/race';

interface CharaDetailClientProps {
  charaRow: CharaRow;
  race: RaceRow;
  variantElement: ElementAttacks | null;
}

export default function CharaDetailClient({
  charaRow,
  race,
  variantElement,
}: CharaDetailClientProps) {
  const chara = new Chara(charaRow, variantElement);
  const raceObj = new Race(race);
  const { t, i18n } = useTranslation('common');

  const feats = chara.feats();
  const negations = chara.negations();
  const others = chara.others();
  const figures = raceObj.figures();
  const bodyPartsOrder = [
    'hand',
    'head',
    'torso',
    'back',
    'waist',
    'arm',
    'foot',
    'neck',
    'finger',
  ];
  const totalBodyParts = raceObj.totalBodyParts();
  const abilities = chara.abilities();
  const [actualGeneSlot, origGeneSlot] = chara.geneSlot();

  const resistances = resistanceElements().map((element) => ({
    value: chara.getElementPower(element.alias),
    element: element,
  }));

  const renderElementChips = (
    elements: Array<{ element: Element; power: number }>
  ) => {
    return elements.map((elementWithPower, index) => {
      const element = elementWithPower.element;
      const featName = element.name(i18n.language);

      return (
        <Tooltip
          key={index}
          title={createFeatTooltipContent(element, elementWithPower.power)}
          arrow
          placement="top"
          slotProps={{
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
          }}
        >
          <Chip
            label={`${featName}${elementWithPower.power !== 1 ? ` (${elementWithPower.power})` : ''}`}
            variant="outlined"
            size="small"
            clickable
            onClick={() => {
              console.log(`Navigate to element detail: ${element.id}`);
            }}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
                borderColor: 'primary.main',
                '& .MuiChip-label': {
                  color: 'primary.dark',
                },
              },
            }}
          />
        </Tooltip>
      );
    });
  };

  const createFeatTooltipContent = (element: Element, power: number) => {
    const featName = element.name(i18n.language);
    const detail = element.detail(i18n.language);
    const textPhase = element.textPhase(i18n.language);
    const textExtra = element.textExtra(i18n.language);

    const subElements = element.subElements().map((sub) => ({
      element: sub.element,
      power: Math.floor(power * sub.coefficient),
    }));

    return (
      <Box sx={{ maxWidth: 300 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          {featName}
          {power > 1 ? ` (${power})` : ''}
        </Typography>
        {detail && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {detail}
          </Typography>
        )}
        {textPhase && (
          <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
            {textPhase}
          </Typography>
        )}
        {(textExtra || subElements.length > 0) && (
          <Box component="ul" sx={{ m: 0, pl: 2, listStyleType: 'disc' }}>
            {textExtra &&
              textExtra.split(',').map((item: string, index: number) => (
                <Typography
                  component="li"
                  variant="body2"
                  key={`text-${index}`}
                  sx={{ mb: 0.5 }}
                >
                  {item.trim()}
                </Typography>
              ))}
            {subElements.map((sub, subIndex: number) => (
              <Typography
                component="li"
                variant="body2"
                key={`sub-${subIndex}`}
                sx={{ mb: 0.5 }}
              >
                {sub.element.name(i18n.language)} {sub.power > 0 ? '+' : ''}
                {sub.power}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          component={Link}
          href="/charas"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          {t('backToCharacters')}
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Typography variant="h3" component="h1">
                  {chara.normalizedName(i18n.language)}
                </Typography>
                {chara.mainElement && (
                  <Chip
                    label={chara.mainElement.name(i18n.language)}
                    variant="filled"
                    color="secondary"
                    size="medium"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      height: '32px',
                    }}
                  />
                )}
              </Box>
              <Chip
                label={`${t('id')}: ${chara.id}`}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('characterId')}
              </Typography>
              <Typography variant="body1">{chara.id}</Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('race')}
              </Typography>
              <Typography variant="body1">
                {raceObj.name(i18n.language)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('level')}
              </Typography>
              <Typography variant="body1">{chara.level()}</Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('geneSlot')}
              </Typography>
              <Typography variant="body1">
                {actualGeneSlot}
                {actualGeneSlot !== origGeneSlot && (
                  <span style={{ color: 'text.secondary' }}>
                    {' '}
                    ({origGeneSlot})
                  </span>
                )}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('stats')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('life')}
                  </Typography>
                  <Typography variant="h6">{chara.life()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('mana')}
                  </Typography>
                  <Typography variant="h6">{chara.mana()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('speed')}
                  </Typography>
                  <Typography variant="h6">{chara.speed()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('vigor')}
                  </Typography>
                  <Typography variant="h6">{chara.vigor()}</Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('defenseStats')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('dv')}
                  </Typography>
                  <Typography variant="h6">{chara.dv()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('pv')}
                  </Typography>
                  <Typography variant="h6">{chara.pv()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('pdr')}
                  </Typography>
                  <Typography variant="h6">{chara.pdr()}%</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('edr')}
                  </Typography>
                  <Typography variant="h6">{chara.edr()}%</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('ep')}
                  </Typography>
                  <Typography variant="h6">{chara.ep()}</Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('resistances')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 1,
                }}
              >
                {resistances.map((resistance) => (
                  <Box
                    key={resistance.element.alias}
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {resistance.element.name(i18n.language)}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={
                        resistance.value > 0
                          ? 'success.main'
                          : resistance.value < 0
                            ? 'error.main'
                            : 'text.primary'
                      }
                    >
                      {resistance.value > 0 ? '+' : ''}
                      {resistance.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('bodyParts')} ({totalBodyParts})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {bodyPartsOrder.map((part) => {
                  const count = figures[part as keyof typeof figures];
                  return (
                    <Chip
                      key={part}
                      label={`${t(part)} (${count})`}
                      variant={count > 0 ? 'outlined' : 'filled'}
                      size="medium"
                      color={count > 0 ? 'info' : 'default'}
                      sx={count === 0 ? { opacity: 0.5 } : {}}
                    />
                  );
                })}
              </Box>
            </Box>

            {feats.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('feats')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {renderElementChips(feats)}
                </Box>
              </Box>
            )}

            {negations.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('statusResistances')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {negations.map((negation, index) => {
                    const element = negation.element;
                    const negationName = element.name(i18n.language);

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Chip
                          label={`${negationName}${negation.power > 1 ? ` (${negation.power})` : ''}`}
                          variant="outlined"
                          size="small"
                          color="error"
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {others.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  その他の属性
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {renderElementChips(others)}
                </Box>
              </Box>
            )}

            {abilities.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('abilities')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {abilities.map((ability, index) => {
                    const baseElement = elementByAlias(ability.name);
                    const elementElement = ability.element
                      ? (elementByAlias(ability.element) ?? null)
                      : null;

                    let abilityName: string;
                    if (baseElement) {
                      abilityName = baseElement.abilityName(
                        elementElement,
                        i18n.language
                      );
                    } else {
                      abilityName = ability.name;
                    }

                    const displayLabel = `${abilityName}${ability.party ? ` (${t('range')})` : ''}`;

                    return (
                      <Chip
                        key={index}
                        label={displayLabel}
                        variant="outlined"
                        size="small"
                        color="primary"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
