'use client';

import { FormControl, Select, MenuItem } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import {
  SearchOperator,
  NUMERIC_OPERATORS,
  STRING_OPERATORS,
} from '@/lib/advancedSearchTypes';

interface OperatorSelectorProps {
  fieldType: 'number' | 'string' | null;
  value: SearchOperator;
  onChange: (operator: SearchOperator) => void;
}

export default function OperatorSelector({
  fieldType,
  value,
  onChange,
}: OperatorSelectorProps) {
  const { t } = useTranslation();

  const getOperatorLabel = (op: SearchOperator): string => {
    const labels: Record<SearchOperator, string> = {
      '>=': t.advancedSearch.greaterOrEqual,
      '<=': t.advancedSearch.lessOrEqual,
      '=': t.advancedSearch.equal,
      '!=': t.advancedSearch.notEqual,
      '>': t.advancedSearch.greaterThan,
      '<': t.advancedSearch.lessThan,
      between: t.advancedSearch.between,
      contains: t.advancedSearch.contains,
      not_contains: t.advancedSearch.notContains,
      equals: t.advancedSearch.equals,
      not_equals: t.advancedSearch.notEquals,
      starts_with: t.advancedSearch.startsWith,
      ends_with: t.advancedSearch.endsWith,
      empty: t.advancedSearch.empty,
      not_empty: t.advancedSearch.notEmpty,
    };
    return labels[op] || op;
  };

  const operators: SearchOperator[] =
    fieldType === 'number'
      ? (NUMERIC_OPERATORS as SearchOperator[])
      : fieldType === 'string'
        ? (STRING_OPERATORS as SearchOperator[])
        : [];

  // フィールドが選択されていない場合
  if (!fieldType || operators.length === 0) {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select value="" disabled>
          <MenuItem value="">{t.advancedSearch.selectOperator}</MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as SearchOperator)}
      >
        {operators.map((op) => (
          <MenuItem key={op} value={op}>
            {getOperatorLabel(op)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
