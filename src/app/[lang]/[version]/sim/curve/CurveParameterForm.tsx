'use client';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon, HelpOutline } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import type { CurveConfigSet } from '@/lib/curveUtils';

interface CurveParameterFormProps {
  /** 設定 */
  config: CurveConfigSet;
  /** 設定が変更された時のコールバック */
  onChange: (config: CurveConfigSet) => void;
  /** 削除ボタンを表示するかどうか */
  showDelete: boolean;
  /** 削除時のコールバック */
  onDelete: () => void;
}

export default function CurveParameterForm({
  config,
  onChange,
  showDelete,
  onDelete,
}: CurveParameterFormProps) {
  const { t } = useTranslation();

  const handleParamChange = (
    param: 'start' | 'step' | 'rate',
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    // バリデーション
    let validValue = numValue;
    if (param === 'rate') {
      validValue = Math.max(0, Math.min(100, numValue));
    } else if (param === 'start' || param === 'step') {
      validValue = Math.max(0, numValue);
    }

    onChange({
      ...config,
      params: {
        ...config.params,
        [param]: validValue,
      },
    });
  };

  const handleNameChange = (name: string) => {
    onChange({
      ...config,
      name,
    });
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor: config.color,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <TextField
          size="small"
          value={config.name}
          onChange={(e) => handleNameChange(e.target.value)}
          sx={{ width: 150 }}
          variant="standard"
          inputProps={{
            style: { fontWeight: 'bold', color: config.color },
          }}
        />
        {showDelete && (
          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* start */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            label={t.curveSim.start}
            type="number"
            size="small"
            value={config.params.start}
            onChange={(e) => handleParamChange('start', e.target.value)}
            sx={{ width: 120 }}
            slotProps={{
              htmlInput: { min: 0 },
            }}
          />
          <Tooltip title={t.curveSim.startHelp}>
            <HelpOutline fontSize="small" color="action" />
          </Tooltip>
        </Box>

        {/* step */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            label={t.curveSim.step}
            type="number"
            size="small"
            value={config.params.step}
            onChange={(e) => handleParamChange('step', e.target.value)}
            sx={{ width: 120 }}
            slotProps={{
              htmlInput: { min: 1 },
            }}
          />
          <Tooltip title={t.curveSim.stepHelp}>
            <HelpOutline fontSize="small" color="action" />
          </Tooltip>
        </Box>

        {/* rate */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            label={t.curveSim.rate}
            type="number"
            size="small"
            value={config.params.rate}
            onChange={(e) => handleParamChange('rate', e.target.value)}
            sx={{ width: 120 }}
            slotProps={{
              htmlInput: { min: 0, max: 100 },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            %
          </Typography>
          <Tooltip title={t.curveSim.rateHelp}>
            <HelpOutline fontSize="small" color="action" />
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}
