'use client';

import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import { FieldInfo } from '@/lib/advancedSearchTypes';
import { getCategoryName } from '@/lib/advancedSearchUtils';
import { normalizeForSearch } from '@/lib/searchUtils';

interface FieldSelectorProps {
  fields: FieldInfo[];
  value: string;
  onChange: (fieldKey: string, field: FieldInfo | null) => void;
}

export default function FieldSelector({
  fields,
  value,
  onChange,
}: FieldSelectorProps) {
  const { t } = useTranslation();

  const options = fields.map((field) => field.key);

  return (
    <Autocomplete
      size="small"
      options={options}
      value={value || null}
      onChange={(_, newValue) => {
        const field = newValue
          ? fields.find((f) => f.key === newValue) || null
          : null;
        onChange(newValue || '', field);
      }}
      groupBy={(option) => {
        const field = fields.find((f) => f.key === option);
        return field ? getCategoryName(field.category, t) : '';
      }}
      filterOptions={(options, { inputValue }) => {
        const normalizedInput = normalizeForSearch(inputValue);
        if (!normalizedInput) return options;

        return options.filter((option) => {
          const field = fields.find((f) => f.key === option);
          if (!field) return false;
          const normalizedDisplayName = normalizeForSearch(field.displayName);
          const normalizedJa = normalizeForSearch(field.nameJa);
          const normalizedEn = normalizeForSearch(field.nameEn);
          const normalizedKey = normalizeForSearch(field.key);
          return (
            normalizedDisplayName.includes(normalizedInput) ||
            normalizedJa.includes(normalizedInput) ||
            normalizedEn.includes(normalizedInput) ||
            normalizedKey.includes(normalizedInput)
          );
        });
      }}
      getOptionLabel={(option) => {
        const field = fields.find((f) => f.key === option);
        return field?.displayName || option;
      }}
      renderOption={(props, option) => {
        const field = fields.find((f) => f.key === option);
        const { key, ...otherProps } = props;
        return (
          <Box component="li" key={key} {...otherProps}>
            <Typography variant="body2">
              {field?.displayName || option}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} placeholder={t.advancedSearch.selectField} />
      )}
      sx={{ minWidth: 180 }}
    />
  );
}
