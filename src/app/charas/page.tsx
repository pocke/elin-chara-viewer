import { allCharas, normalizedCharaName } from "@/lib/chara";
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import Link from 'next/link';

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

        <Grid container spacing={3}>
          {charas.map(chara => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={chara.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea component={Link} href={`/charas/${chara.id}`} sx={{ flexGrow: 1 }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {normalizedCharaName(chara)}
                    </Typography>
                    <Chip 
                      label={`ID: ${chara.id}`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
