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
import { Chara, type CharaRow } from '@/lib/chara';
import { Element, type ElementRow } from '@/lib/element';
import { Race, type RaceRow } from '@/lib/race';

interface CharaDetailClientProps {
  charaRow: CharaRow;
  elements: ElementRow[];
  race: RaceRow;
}

export default function CharaDetailClient({
  charaRow,
  elements,
  race,
}: CharaDetailClientProps) {
  const chara = new Chara(charaRow);
  const raceObj = new Race(race);
  const elementsMap = new Map(
    elements.map((element) => [element.alias, new Element(element)])
  );
  const { t, i18n } = useTranslation('common');

  const charaFeats = chara.feats();

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
              <Typography variant="body1">{raceObj.name(i18n.language)}</Typography>
            </Box>

            {charaFeats.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('feats')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {charaFeats.map((feat, index) => {
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
