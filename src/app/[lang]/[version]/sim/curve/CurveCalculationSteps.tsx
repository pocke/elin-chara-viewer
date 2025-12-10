'use client';
import {
  Box,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/simple-i18n';
import { curveWithSteps, type CurveParams } from '@/lib/curveUtils';

interface CurveCalculationStepsProps {
  /** Curveパラメータ */
  params: CurveParams;
}

export default function CurveCalculationSteps({
  params,
}: CurveCalculationStepsProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<number>(50);

  // 計算結果
  const result = useMemo(() => {
    return curveWithSteps(inputValue, params);
  }, [inputValue, params]);

  const handleInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setInputValue(num);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t.curveSim.singleCalculation}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          label={t.curveSim.input}
          type="number"
          size="small"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          sx={{ width: 120 }}
          slotProps={{
            htmlInput: { min: 0 },
          }}
        />
        <ArrowIcon color="action" />
        <Typography variant="h5" color="primary">
          {result.output}
        </Typography>
        {result.reduction > 0 && (
          <Typography variant="body2" color="text.secondary">
            ({t.curveSim.reduction}: -{result.reduction})
          </Typography>
        )}
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        {t.curveSim.calculationSteps}
      </Typography>

      {result.steps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.curveSim.noReduction}
        </Typography>
      ) : (
        <List dense>
          {result.steps.map((step, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {step.applied ? (
                  <ArrowIcon fontSize="small" color="primary" />
                ) : (
                  <CheckIcon fontSize="small" color="success" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  step.applied ? (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      Step {step.stepNumber}: {step.inputValue} &gt;{' '}
                      {step.threshold} → floor({step.threshold} + (
                      {step.inputValue} - {step.threshold}) × {params.rate}/100)
                      = {step.outputValue}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      Step {step.stepNumber}: {step.inputValue} ≤{' '}
                      {step.threshold} → {t.curveSim.output}: {step.outputValue}
                    </Typography>
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
