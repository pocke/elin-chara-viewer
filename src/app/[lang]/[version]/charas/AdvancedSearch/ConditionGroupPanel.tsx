'use client';

import {
  Box,
  Paper,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  ConditionGroup,
  SearchConditionOrGroup,
  FieldInfo,
  isConditionGroup,
  createNewCondition,
  createNewGroup,
} from '@/lib/advancedSearchTypes';
import { useTranslation } from '@/lib/simple-i18n';
import SearchConditionRow from './SearchConditionRow';

interface ConditionGroupPanelProps {
  group: ConditionGroup;
  fields: FieldInfo[];
  onUpdate: (group: ConditionGroup) => void;
  onRemove: () => void;
  depth?: number;
}

export default function ConditionGroupPanel({
  group,
  fields,
  onUpdate,
  onRemove,
  depth = 0,
}: ConditionGroupPanelProps) {
  const { t } = useTranslation();

  const handleLogicChange = (
    _: React.MouseEvent<HTMLElement>,
    newLogic: 'AND' | 'OR' | null
  ) => {
    if (newLogic) {
      onUpdate({ ...group, logic: newLogic });
    }
  };

  const handleConditionUpdate = (
    index: number,
    updated: SearchConditionOrGroup
  ) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onUpdate({ ...group, conditions: newConditions });
  };

  const handleConditionRemove = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({ ...group, conditions: newConditions });
  };

  const handleAddCondition = () => {
    onUpdate({
      ...group,
      conditions: [...group.conditions, createNewCondition()],
    });
  };

  const handleAddGroup = () => {
    onUpdate({
      ...group,
      conditions: [
        ...group.conditions,
        createNewGroup(group.logic === 'AND' ? 'OR' : 'AND'),
      ],
    });
  };

  // ネストの深さに応じて色を変える
  const borderColors = [
    'primary.main',
    'secondary.main',
    'success.main',
    'warning.main',
    'info.main',
  ];
  const borderColor = borderColors[depth % borderColors.length];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderLeft: 4,
        borderColor: borderColor,
        bgcolor: depth % 2 === 0 ? 'background.paper' : 'action.hover',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t.advancedSearch.operator}:
          </Typography>
          <ToggleButtonGroup
            value={group.logic}
            exclusive
            onChange={handleLogicChange}
            size="small"
          >
            <ToggleButton value="AND" sx={{ px: 1.5, py: 0.5 }}>
              AND
            </ToggleButton>
            <ToggleButton value="OR" sx={{ px: 1.5, py: 0.5 }}>
              OR
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <IconButton size="small" onClick={onRemove} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {group.conditions.map((condition, index) => (
          <Box key={condition.id}>
            {isConditionGroup(condition) ? (
              <ConditionGroupPanel
                group={condition}
                fields={fields}
                onUpdate={(updated) => handleConditionUpdate(index, updated)}
                onRemove={() => handleConditionRemove(index)}
                depth={depth + 1}
              />
            ) : (
              <SearchConditionRow
                condition={condition}
                fields={fields}
                onUpdate={(updated) => handleConditionUpdate(index, updated)}
                onRemove={() => handleConditionRemove(index)}
              />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddCondition}
          variant="text"
        >
          {t.advancedSearch.addCondition}
        </Button>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddGroup}
          variant="text"
        >
          {t.advancedSearch.addGroup}
        </Button>
      </Box>
    </Paper>
  );
}
