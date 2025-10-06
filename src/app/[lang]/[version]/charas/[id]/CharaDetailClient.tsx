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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Chara, type CharaRow } from '@/lib/models/chara';
import {
  ElementAttacks,
  elementByAlias,
  resistanceElements,
  Element,
} from '@/lib/models/element';
import ResistanceBarChart from '@/components/ResistanceBarChart';
import { getContrastColor } from '@/lib/colorUtils';

interface CharaDetailClientProps {
  charaRow: CharaRow;
  variantElement: ElementAttacks | null;
}

export default function CharaDetailClient({
  charaRow,
  variantElement,
}: CharaDetailClientProps) {
  const chara = new Chara(charaRow, variantElement);
  const { t, language } = useTranslation();

  const params = useParams();
  const lang = params.lang as string;
  const version = params.version as string;

  const feats = chara.feats();
  const negations = chara.negations();
  const others = chara.others();
  const figures = chara.race.figures();
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
  const totalBodyParts = chara.race.totalBodyParts();
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
      const featName = element.name(language);

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
              borderColor: element.getColor(),
              color: element.getColor(),
              '&:hover': {
                backgroundColor: element.getColor() + '20',
                borderColor: element.getColor(),
                '& .MuiChip-label': {
                  color: element.getColor(),
                },
              },
            }}
          />
        </Tooltip>
      );
    });
  };

  const createRawDataTable = <T extends Record<string, unknown>>(
    title: string,
    row: T
  ) => {
    // Filter out __meta field
    const filteredEntries = Object.entries(row).filter(
      ([key]) => key !== '__meta'
    );

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {title}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Key</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>
                    {value !== null && value !== undefined ? String(value) : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const createFeatTooltipContent = (element: Element, power: number) => {
    const featName = element.name(language);
    const detail = element.detail(language);
    const textPhase = element.textPhase(language);
    const textExtra = element.textExtra(language);

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
                {sub.element.name(language)} {sub.power > 0 ? '+' : ''}
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
          href={`/${lang}/${version}/charas`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          {t.common.backToCharacters}
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Typography variant="h3" component="h1">
                  {chara.normalizedName(language)}
                </Typography>
                {chara.mainElement && (
                  <Chip
                    label={chara.mainElement.name(language)}
                    variant="filled"
                    size="medium"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      height: '32px',
                      backgroundColor: chara.mainElement.getColor(),
                      color: getContrastColor(chara.mainElement.getColor()),
                      '&:hover': {
                        backgroundColor: chara.mainElement.getColor(),
                        opacity: 0.8,
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.race}
                </Typography>
                <Typography variant="body1">
                  {chara.race.name(language)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.job}
                </Typography>
                <Typography variant="body1">
                  {chara.job().name(language)}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.level}
              </Typography>
              <Typography variant="body1">{chara.level()}</Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.geneSlot}
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
                {t.common.stats}
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
                    {t.common.life}
                  </Typography>
                  <Typography variant="h6">{chara.life()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.mana}
                  </Typography>
                  <Typography variant="h6">{chara.mana()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.speed}
                  </Typography>
                  <Typography variant="h6">{chara.speed()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.vigor}
                  </Typography>
                  <Typography variant="h6">{chara.vigor()}</Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.defenseStats}
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
                    {t.common.dv}
                  </Typography>
                  <Typography variant="h6">{chara.dv()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.pv}
                  </Typography>
                  <Typography variant="h6">{chara.pv()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.pdr}
                  </Typography>
                  <Typography variant="h6">{chara.pdr()}%</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.edr}
                  </Typography>
                  <Typography variant="h6">{chara.edr()}%</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.ep}
                  </Typography>
                  <Typography variant="h6">{chara.ep()}</Typography>
                </Box>
              </Box>
            </Box>

            <ResistanceBarChart resistances={resistances} locale={language} />

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.bodyParts} ({totalBodyParts})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {bodyPartsOrder.map((part) => {
                  const count = figures[part as keyof typeof figures];
                  return (
                    <Chip
                      key={part}
                      label={`${t.common[part as keyof typeof t.common]} (${count})`}
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
                  {t.common.feats}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {renderElementChips(feats)}
                </Box>
              </Box>
            )}

            {negations.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.statusResistances}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {negations.map((negation, index) => {
                    const element = negation.element;
                    const negationName = element.name(language);

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
                          sx={{
                            borderColor: element.getColor(),
                            color: element.getColor(),
                            '&:hover': {
                              backgroundColor: element.getColor() + '20',
                              borderColor: element.getColor(),
                            },
                          }}
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
                  {t.common.abilities}
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
                        language
                      );
                    } else {
                      abilityName = ability.name;
                    }

                    const displayLabel = `${abilityName}${ability.party ? ` (${t.common.range})` : ''}`;

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

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.tactics}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.tacticsName}
                  </Typography>
                  <Typography variant="h6">
                    {chara.tactics().name(language)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.tacticsDistance}
                  </Typography>
                  <Typography variant="h6">
                    {chara.tacticsDistance()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.common.tacticsMoveFrequency}
                  </Typography>
                  <Typography variant="h6">
                    {chara.tacticsMoveFrequency()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="text.secondary">
                  {t.common.rawData}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {createRawDataTable(t.common.charaRawData, charaRow)}
                {createRawDataTable(t.common.raceRawData, chara.race.row)}
                {createRawDataTable(t.common.jobRawData, chara.job().row)}
              </AccordionDetails>
            </Accordion>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
