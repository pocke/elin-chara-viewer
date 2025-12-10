'use client';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from '@/lib/simple-i18n';
import { DEFAULT_PRESETS, type CurveParams } from '@/lib/curveUtils';

interface CurvePresetsProps {
  /** プリセットが選択された時のコールバック */
  onSelectPreset: (params: CurveParams, presetName: string) => void;
}

export default function CurvePresets({ onSelectPreset }: CurvePresetsProps) {
  const { t } = useTranslation();

  // プリセット名を取得（翻訳キーに基づく）
  const getPresetName = (nameKey: string): string => {
    switch (nameKey) {
      case 'spellCount':
        return t.curveSim.presetSpellCount;
      case 'stamina':
        return t.curveSim.presetStamina;
      case 'bounty':
        return t.curveSim.presetBounty;
      default:
        return nameKey;
    }
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    const presetId = event.target.value;
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onSelectPreset(preset.params, getPresetName(preset.nameKey));
    }
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="preset-select-label">{t.curveSim.presets}</InputLabel>
        <Select
          labelId="preset-select-label"
          id="preset-select"
          defaultValue=""
          label={t.curveSim.presets}
          onChange={handleChange}
        >
          {DEFAULT_PRESETS.map((preset) => (
            <MenuItem key={preset.id} value={preset.id}>
              {getPresetName(preset.nameKey)} (start={preset.params.start},
              step={preset.params.step}, rate={preset.params.rate})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
