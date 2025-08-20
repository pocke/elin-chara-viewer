import { allCharas } from "@/lib/charaDb";
import { Container, Typography, Box } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import CharaTable from './CharaTable';

export default async function CharaPage() {
  const charas = await allCharas();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            All Characters
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Browse through {charas.length} characters
        </Typography>

        <CharaTable charas={charas} />
      </Box>
    </Container>
  );
}
