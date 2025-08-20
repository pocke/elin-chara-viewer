import { allCharas, findCharaById } from "@/lib/charaDb";
import { Chara } from "@/lib/chara";
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { Person as PersonIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';

export const generateStaticParams = async () => {
  return (await allCharas()).map(charaRow => ({ id: charaRow.id }));
}

export default async function CharaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const charaRow = await findCharaById(params.id);
  const chara = new Chara(charaRow);
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
          Back to Characters
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {chara.name_JP}
              </Typography>
              <Chip 
                label={`ID: ${chara.id}`}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Character ID
              </Typography>
              <Typography variant="body1">
                {chara.id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Character Name
              </Typography>
              <Typography variant="body1">
                {chara.name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Japanese Name
              </Typography>
              <Typography variant="body1">
                {chara.name_JP}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
