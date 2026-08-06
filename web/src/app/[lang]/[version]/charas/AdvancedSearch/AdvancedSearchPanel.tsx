'use client';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Chip,
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
import { isConditionComplete } from '@/lib/advancedSearchUtils';
import { useTranslation } from '@/lib/simple-i18n';
import SearchConditionRow from './SearchConditionRow';
import ConditionGroupPanel from './ConditionGroupPanel';

// 条件の配列内に有効な条件があるかを再帰的に判定
function hasActiveConditions(conditions: SearchConditionOrGroup[]): boolean {
  return conditions.some((condition) => {
    if (isConditionGroup(condition)) {
      return hasActiveConditions(condition.conditions);
    } else {
      return isConditionComplete(condition);
    }
  });
}

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
    // 条件をクリアするが、パネルは開いたままにする
    onChange({
      ...createEmptyAdvancedSearchState(),
      enabled: true,
    });
  };

  const hasConditions = state.conditions.length > 0;
  const isActive = hasActiveConditions(state.conditions);
  // パネルが閉じていて、有効な条件がある場合に「適用中」を表示
  const showActiveIndicator = !state.enabled && isActive;

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
            gap: 1,
            width: '100%',
            pr: 2,
          }}
        >
          <Typography>{t.advancedSearch.title}</Typography>
          {showActiveIndicator && (
            <Chip
              label={t.advancedSearch.active}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
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
            <Box key={condition.id}>
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

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
