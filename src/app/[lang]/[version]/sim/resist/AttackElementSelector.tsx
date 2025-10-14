'use client';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { attackElements } from '@/lib/models/element';
import type { AttackElement } from '@/lib/resistSimUtils';
import { getContrastColor } from '@/lib/colorUtils';

interface AttackElementSelectorProps {
  selectedElements: AttackElement[];
  onElementsChange: (elements: AttackElement[]) => void;
}

export default function AttackElementSelector({
  selectedElements,
  onElementsChange,
}: AttackElementSelectorProps) {
  const { t, language } = useTranslation();
  const [newElementAlias, setNewElementAlias] = useState<string>('');

  const availableElements = attackElements();

  const handleAddElement = () => {
    if (!newElementAlias) return;

    // Check if element is already selected
    if (selectedElements.some((e) => e.element === newElementAlias)) {
      return;
    }

    const newElement: AttackElement = {
      element: newElementAlias,
      isSword: false,
      isFeatElder: false,
      isFeatZodiac: false,
    };

    onElementsChange([...selectedElements, newElement]);
    setNewElementAlias('');
  };

  const handleRemoveElement = (index: number) => {
    const newElements = [...selectedElements];
    newElements.splice(index, 1);
    onElementsChange(newElements);
  };

  const handleToggleModifier = (
    index: number,
    modifier: 'isSword' | 'isFeatElder' | 'isFeatZodiac'
  ) => {
    const newElements = [...selectedElements];
    newElements[index] = {
      ...newElements[index],
      [modifier]: !newElements[index][modifier],
    };
    onElementsChange(newElements);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t.resistSim.attackElements}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.resistSim.description}
      </Typography>

      {/* Add element form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t.resistSim.selectElement}</InputLabel>
          <Select
            value={newElementAlias}
            onChange={(e) => setNewElementAlias(e.target.value)}
            label={t.resistSim.selectElement}
          >
            {availableElements.map((elem) => (
              <MenuItem
                key={elem.alias}
                value={elem.alias}
                disabled={selectedElements.some(
                  (e) => e.element === elem.alias
                )}
              >
                {elem.name(language)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddElement}
          disabled={!newElementAlias}
        >
          {t.resistSim.addElement}
        </Button>
      </Box>

      {/* Selected elements list */}
      {selectedElements.length === 0 ? (
        <Alert severity="info">{t.resistSim.noElements}</Alert>
      ) : (
        <Stack spacing={2}>
          {selectedElements.map((attackElem, index) => {
            const element = availableElements.find(
              (e) => e.alias === attackElem.element
            );
            if (!element) return null;

            return (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={element.name(language)}
                      sx={{
                        backgroundColor: element.getColor(),
                        color: getContrastColor(element.getColor()),
                        fontWeight: 'bold',
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attackElem.isSword}
                            onChange={() =>
                              handleToggleModifier(index, 'isSword')
                            }
                          />
                        }
                        label={t.resistSim.isSword}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attackElem.isFeatElder}
                            onChange={() =>
                              handleToggleModifier(index, 'isFeatElder')
                            }
                          />
                        }
                        label={t.resistSim.isFeatElder}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attackElem.isFeatZodiac}
                            onChange={() =>
                              handleToggleModifier(index, 'isFeatZodiac')
                            }
                          />
                        }
                        label={t.resistSim.isFeatZodiac}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveElement(index)}
                    aria-label={t.resistSim.remove}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Filter description */}
      {selectedElements.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t.resistSim.filterDescription}
        </Alert>
      )}
    </Paper>
  );
}
