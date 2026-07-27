'use client';
import { Button, Divider, Menu, MenuItem } from '@mui/material';
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink';
import { GAME_VERSIONS, GameVersion } from '@/lib/db';
import { useTranslation } from '@/lib/simple-i18n';

export default function VersionSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const segments = pathname.split('/');
  const lang = segments[1];
  const currentVersion: GameVersion | null = segments[2] ?? null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeVersion = (newVersion: GameVersion) => {
    if (currentVersion) {
      const newSegments = [...segments];
      newSegments[2] = newVersion;
      router.push(newSegments.join('/'));
    }
    handleClose();
  };

  if (!currentVersion || segments.length < 4) {
    return null;
  }

  return (
    <>
      <Button
        startIcon={<SwapHorizIcon />}
        onClick={handleClick}
        variant="outlined"
        size="small"
        sx={{
          color: 'white',
          borderColor: 'white',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.7)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {currentVersion}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {GAME_VERSIONS.map((version) => (
          <MenuItem
            key={version}
            onClick={() => changeVersion(version)}
            selected={version === currentVersion}
          >
            {version}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          component={Link}
          href={`/${lang}/versions`}
          onClick={handleClose}
        >
          {t.common.pastVersionsTitle}
        </MenuItem>
      </Menu>
    </>
  );
}
