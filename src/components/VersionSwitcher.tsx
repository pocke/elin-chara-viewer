'use client';
import { Button, Menu, MenuItem } from '@mui/material';
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GAME_VERSIONS, GameVersion } from '@/lib/db';

export default function VersionSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Extract current version from pathname (e.g., /ja/EA/charas -> EA)
  const pathParts = pathname.split('/');
  const currentVersion =
    pathParts.length >= 3 && GAME_VERSIONS.includes(pathParts[2] as GameVersion)
      ? (pathParts[2] as GameVersion)
      : null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeVersion = (newVersion: GameVersion) => {
    if (currentVersion) {
      // Replace version in path: /ja/EA/charas -> /ja/Nightly/charas
      const newPath = pathname.replace(
        `/${currentVersion}/`,
        `/${newVersion}/`
      );
      router.push(newPath);
    }
    handleClose();
  };

  // Don't render if not on a versioned page
  if (!currentVersion) {
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
      </Menu>
    </>
  );
}
