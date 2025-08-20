import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Menu as MenuIcon } from '@mui/icons-material';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Elin Character Viewer
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Welcome to your character database
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Getting Started</Typography>
          </Box>
          <Typography paragraph>
            This application allows you to browse and manage character information for Elin.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<MenuIcon />}>
              Browse Characters
            </Button>
            <Button variant="outlined">
              View Documentation
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
