'use client';
import {
  Container,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Checkbox,
} from '@mui/material';
import {
  Person as PersonIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { type CharaRow, Chara } from '@/lib/models/chara';
import DataGridCharaTable from './DataGridCharaTable';

interface CharaPageClientProps {
  charaRows: CharaRow[];
}

export default function CharaPageClient({ charaRows }: CharaPageClientProps) {
  const charas = useMemo(
    () => charaRows.map((row) => new Chara(row)),
    [charaRows]
  );
  const { t } = useTranslation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  // Column visibility state - simplified to groups only
  const [showStatusColumns, setShowStatusColumns] = useState(true);
  const [showResistances, setShowResistances] = useState(false);

  // Menu state for column visibility
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const isColumnMenuOpen = Boolean(columnMenuAnchorEl);

  // On mobile devices, hide status columns by default to save space
  useEffect(() => {
    if (isMobile) {
      setShowStatusColumns(false);
    }
  }, [isMobile]);

  // Expand characters with variants (memoized for performance)
  const allCharas = useMemo(() => {
    return charas.flatMap((chara) => {
      const variants = chara.variants();
      return variants.length > 0 ? variants : [chara];
    });
  }, [charas]);





  // Column visibility handlers - simplified
  const handleStatusColumnsToggle = useCallback(() => {
    setShowStatusColumns((prev) => !prev);
  }, []);

  const handleResistancesToggle = useCallback(() => {
    setShowResistances((prev) => !prev);
  }, []);

  // Menu handlers
  const handleColumnMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setColumnMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleColumnMenuClose = useCallback(() => {
    setColumnMenuAnchorEl(null);
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.common.allCharacters}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t.common.charactersCount.replace(
            '{{count}}',
            allCharas.length.toString()
          )}
        </Typography>

        {/* Column visibility controls */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={handleColumnMenuOpen}
            aria-controls={isColumnMenuOpen ? 'column-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isColumnMenuOpen ? 'true' : undefined}
          >
            {t.common.columnVisibility}
          </Button>
          <Menu
            id="column-menu"
            anchorEl={columnMenuAnchorEl}
            open={isColumnMenuOpen}
            onClose={handleColumnMenuClose}
          >
            <MenuItem onClick={handleStatusColumnsToggle}>
              <Checkbox
                checked={showStatusColumns}
                onChange={handleStatusColumnsToggle}
                size="small"
                sx={{ mr: 1 }}
              />
              {t.common.statusColumns}
            </MenuItem>
            <MenuItem onClick={handleResistancesToggle}>
              <Checkbox
                checked={showResistances}
                onChange={handleResistancesToggle}
                size="small"
                sx={{ mr: 1 }}
              />
              {t.common.resistances}
            </MenuItem>
          </Menu>
        </Box>

        <DataGridCharaTable
          charas={allCharas}
          showStatusColumns={showStatusColumns}
          showResistances={showResistances}
        />
      </Box>
    </Container>
  );
}
