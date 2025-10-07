'use client';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
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
  EmojiEvents as FeatIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Element, type ElementRow } from '@/lib/models/element';
import { Feat } from '@/lib/models/feat';

interface FeatDetailClientProps {
  elementRow: ElementRow;
}

export default function FeatDetailClient({
  elementRow,
}: FeatDetailClientProps) {
  const element = new Element(elementRow);
  const feat = new Feat(elementRow);
  const { t, language } = useTranslation();

  const params = useParams();
  const lang = params.lang as string;
  const version = params.version as string;

  const subElements = element.subElements();

  const createRawDataTable = <T extends Record<string, unknown>>(
    title: string,
    row: T
  ) => {
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

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          component={Link}
          href={`/${lang}/${version}/feats`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          {t.common.backToFeats}
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FeatIcon sx={{ mr: 2, fontSize: 40 }} />
            <Typography variant="h3" component="h1">
              {element.name(language)}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {element.detail(language) && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.description}
                </Typography>
                <Typography variant="body1">
                  {element.detail(language)}
                </Typography>
              </Box>
            )}

            {element.textPhase(language) && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.flavorText}
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {element.textPhase(language)}
                </Typography>
              </Box>
            )}

            {(element.textExtra(language) || subElements.length > 0) && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t.common.effects}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {element.textExtra(language) &&
                    element
                      .textExtra(language)
                      ?.split(',')
                      .map((item, index) => (
                        <Typography
                          component="li"
                          variant="body1"
                          key={`text-${index}`}
                          sx={{ mb: 0.5 }}
                        >
                          {item.trim()}
                        </Typography>
                      ))}
                  {subElements.map((sub, index) => {
                    const subElement = sub.element;
                    const coefficient = sub.coefficient;

                    return (
                      <Typography
                        component="li"
                        variant="body1"
                        key={`sub-${index}`}
                        sx={{ mb: 0.5 }}
                      >
                        {subElement.name(language)} {coefficient > 0 ? '+' : ''}
                        {coefficient}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t.common.basicInfo}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.feat.geneSlot}
                  </Typography>
                  <Typography variant="body1">
                    {element.row.geneSlot === -1 ? '-' : element.row.geneSlot}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.feat.max}
                  </Typography>
                  <Typography variant="body1">{element.row.max}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t.feat.canDropAsGene}
                  </Typography>
                  <Typography variant="body1">
                    {feat.canDropAsGene() ? t.feat.yes : t.feat.no}
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
                {createRawDataTable(
                  t.common.featRawData,
                  element.row as ElementRow
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
