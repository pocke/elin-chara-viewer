'use client';

import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  SearchCondition,
  FieldInfo,
  SearchOperator,
} from '@/lib/advancedSearchTypes';
import FieldSelector from './FieldSelector';
import OperatorSelector from './OperatorSelector';
import ValueInput from './ValueInput';

interface SearchConditionRowProps {
  condition: SearchCondition;
  fields: FieldInfo[];
  onUpdate: (condition: SearchCondition) => void;
  onRemove: () => void;
}

export default function SearchConditionRow({
  condition,
  fields,
  onUpdate,
  onRemove,
}: SearchConditionRowProps) {
  const selectedField = fields.find((f) => f.key === condition.field) || null;

  const handleFieldChange = (fieldKey: string, field: FieldInfo | null) => {
    const prevFieldType = selectedField?.type || null;
    const newFieldType = field?.type || null;

    // 同じ型のフィールドに変更した場合は演算子と値を保持
    if (prevFieldType === newFieldType && prevFieldType !== null) {
      onUpdate({
        ...condition,
        field: fieldKey,
      });
    } else {
      // 異なる型の場合は演算子と値をリセット
      const defaultOperator: SearchOperator =
        newFieldType === 'number' ? '>=' : 'contains';
      onUpdate({
        ...condition,
        field: fieldKey,
        operator: defaultOperator,
        value: '',
      });
    }
  };

  const handleOperatorChange = (operator: SearchOperator) => {
    // between演算子に変わったら値を配列に変換
    let newValue = condition.value;
    if (operator === 'between' && !Array.isArray(condition.value)) {
      newValue = [0, 0];
    } else if (operator !== 'between' && Array.isArray(condition.value)) {
      newValue = '';
    }
    onUpdate({
      ...condition,
      operator,
      value: newValue,
    });
  };

  const handleValueChange = (value: string | number | [number, number]) => {
    onUpdate({
      ...condition,
      value,
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <FieldSelector
        fields={fields}
        value={condition.field}
        onChange={handleFieldChange}
      />
      <OperatorSelector
        fieldType={selectedField?.type || null}
        value={condition.operator}
        onChange={handleOperatorChange}
      />
      <ValueInput
        field={selectedField}
        operator={condition.operator}
        value={condition.value}
        onChange={handleValueChange}
      />
      <IconButton size="small" onClick={onRemove} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
