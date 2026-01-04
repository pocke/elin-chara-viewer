'use client';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import {
  AdvancedSearchState,
  SearchConditionOrGroup,
  FieldInfo,
  isConditionGroup,
  createNewCondition,
  createNewGroup,
  createEmptyAdvancedSearchState,
} from '@/lib/advancedSearchTypes';
import { useTranslation } from '@/lib/simple-i18n';
import SearchConditionRow from './SearchConditionRow';
import ConditionGroupPanel from './ConditionGroupPanel';

interface AdvancedSearchPanelProps {
  state: AdvancedSearchState;
  fields: FieldInfo[];
  onChange: (state: AdvancedSearchState) => void;
}

export default function AdvancedSearchPanel({
  state,
  fields,
  onChange,
}: AdvancedSearchPanelProps) {
  const { t } = useTranslation();

  const handleExpandChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    onChange({ ...state, enabled: isExpanded });
  };

  const handleLogicChange = (
    _: React.MouseEvent<HTMLElement>,
    newLogic: 'AND' | 'OR' | null
  ) => {
    if (newLogic) {
      onChange({ ...state, logic: newLogic });
    }
  };

  const handleConditionUpdate = (
    index: number,
    updated: SearchConditionOrGroup
  ) => {
    const newConditions = [...state.conditions];
    newConditions[index] = updated;
    onChange({ ...state, conditions: newConditions });
  };

  const handleConditionRemove = (index: number) => {
    const newConditions = state.conditions.filter((_, i) => i !== index);
    onChange({ ...state, conditions: newConditions });
  };

  const handleAddCondition = () => {
    onChange({
      ...state,
      conditions: [...state.conditions, createNewCondition()],
    });
  };

  const handleAddGroup = () => {
    onChange({
      ...state,
      conditions: [
        ...state.conditions,
        createNewGroup(state.logic === 'AND' ? 'OR' : 'AND'),
      ],
    });
  };

  const handleClear = () => {
    onChange(createEmptyAdvancedSearchState());
  };

  const hasConditions = state.conditions.length > 0;

  return (
    <Accordion
      expanded={state.enabled}
      onChange={handleExpandChange}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pr: 2,
          }}
        >
          <Typography>{t.advancedSearch.title}</Typography>
          {hasConditions && (
            <Typography variant="caption" color="text.secondary">
              ({state.conditions.length})
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t.advancedSearch.operator}:
          </Typography>
          <ToggleButtonGroup
            value={state.logic}
            exclusive
            onChange={handleLogicChange}
            size="small"
          >
            <ToggleButton value="AND">{t.advancedSearch.and}</ToggleButton>
            <ToggleButton value="OR">{t.advancedSearch.or}</ToggleButton>
          </ToggleButtonGroup>
          {hasConditions && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              color="error"
              variant="outlined"
            >
              {t.advancedSearch.clear}
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {state.conditions.map((condition, index) => (
            <Box
              key={isConditionGroup(condition) ? condition.id : condition.id}
            >
              {isConditionGroup(condition) ? (
                <ConditionGroupPanel
                  group={condition}
                  fields={fields}
                  onUpdate={(updated) => handleConditionUpdate(index, updated)}
                  onRemove={() => handleConditionRemove(index)}
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddCondition}
            variant="outlined"
          >
            {t.advancedSearch.addCondition}
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddGroup}
            variant="outlined"
          >
            {t.advancedSearch.addGroup}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
