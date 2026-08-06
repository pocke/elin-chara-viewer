'use client';

import { TextField, Autocomplete, Box } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import { FieldInfo, SearchOperator } from '@/lib/advancedSearchTypes';
import { normalizeForSearch } from '@/lib/searchUtils';

interface ValueInputProps {
  field: FieldInfo | null;
  operator: SearchOperator;
  value: string | number | [number, number];
  onChange: (value: string | number | [number, number]) => void;
}

export default function ValueInput({
  field,
  operator,
  value,
  onChange,
}: ValueInputProps) {
  const { t } = useTranslation();

  // empty/not_empty演算子の場合は入力不要
  if (operator === 'empty' || operator === 'not_empty') {
    return null;
  }

  // between演算子の場合は2つの入力フィールド
  if (operator === 'between') {
    const rangeValue = Array.isArray(value) ? value : [0, 0];
    return (
      <Box
        sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}
      >
        <TextField
          type="number"
          size="small"
          placeholder={t.advancedSearch.minValue}
          value={rangeValue[0]}
          onChange={(e) => {
            const min = parseFloat(e.target.value) || 0;
            onChange([min, rangeValue[1]]);
          }}
          sx={{ flex: 1, minWidth: 60 }}
        />
        <span>〜</span>
        <TextField
          type="number"
          size="small"
          placeholder={t.advancedSearch.maxValue}
          value={rangeValue[1]}
          onChange={(e) => {
            const max = parseFloat(e.target.value) || 0;
            onChange([rangeValue[0], max]);
          }}
          sx={{ flex: 1, minWidth: 60 }}
        />
      </Box>
    );
  }

  // フィールドに選択肢がある場合はAutocomplete
  if (field?.options && field.options.length > 0) {
    const currentValue = String(value);
    return (
      <Autocomplete
        size="small"
        options={field.options.map((opt) => opt.key)}
        value={currentValue || null}
        onChange={(_, newValue) => {
          onChange(newValue || '');
        }}
        filterOptions={(options, { inputValue }) => {
          const normalizedInput = normalizeForSearch(inputValue);
          if (!normalizedInput) return options;

          return options.filter((option) => {
            const opt = field.options?.find((o) => o.key === option);
            if (!opt) return false;
            const normalizedJa = normalizeForSearch(opt.nameJa);
            const normalizedEn = normalizeForSearch(opt.nameEn);
            return (
              normalizedJa.includes(normalizedInput) ||
              normalizedEn.includes(normalizedInput)
            );
          });
        }}
        getOptionLabel={(option) => {
          const opt = field.options?.find((o) => o.key === option);
          return opt?.displayName || option;
        }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t.advancedSearch.enterValue} />
        )}
        sx={{ minWidth: { xs: 100, sm: 150 }, width: '100%' }}
      />
    );
  }

  // 数値フィールドの場合
  if (field?.type === 'number') {
    return (
      <TextField
        type="number"
        size="small"
        placeholder={t.advancedSearch.enterValue}
        value={value}
        onChange={(e) => {
          const numValue = parseFloat(e.target.value);
          onChange(isNaN(numValue) ? '' : numValue);
        }}
        sx={{ minWidth: 60, width: '100%' }}
      />
    );
  }

  // 文字列フィールドの場合
  return (
    <TextField
      size="small"
      placeholder={t.advancedSearch.enterValue}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: { xs: 100, sm: 150 }, width: '100%' }}
    />
  );
}
