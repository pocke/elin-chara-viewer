'use client';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Chara, type CharaRow } from '@/lib/models/chara';
import {
  Element as GameElement,
  type ElementRow,
  ElementAttacks,
} from '@/lib/models/element';
import { Race, type RaceRow } from '@/lib/models/race';

interface CharaDetailClientProps {
  charaRow: CharaRow;
  elements: ElementRow[];
  races: RaceRow[];
  race: RaceRow;
  variantElement: ElementAttacks | null;
}

export default function CharaDetailClient({
  charaRow,
  elements,
  races,
  race,
  variantElement,
}: CharaDetailClientProps) {
  const racesMap = new Map(races.map((race) => [race.id, new Race(race)]));
  const elementsMap = new Map(
    elements.map((element) => [element.alias, new GameElement(element)])
  );
  const chara = new Chara(charaRow, racesMap, elementsMap, variantElement);
  const raceObj = new Race(race);
  const { t, i18n } = useTranslation('common');

  const feats = chara.feats();
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
  const resistances = chara.getResistances();

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
              <Typography variant="h3" component="h1" gutterBottom>
                {chara.normalizedName(i18n.language)}
              </Typography>
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
                  {feats.map((feat, index) => {
                    const element = elementsMap.get(feat.alias);
                    const featName = element
                      ? element.name(i18n.language)
                      : feat.alias;
                    return (
                      <Chip
                        key={index}
                        label={`${featName}${feat.power > 1 ? ` (${feat.power})` : ''}`}
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
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
                    const baseElement = elementsMap.get(ability.name);
                    const elementElement = ability.element
                      ? (elementsMap.get(ability.element) ?? null)
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
