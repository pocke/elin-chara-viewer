'use client';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CurveParams } from '@/lib/curveUtils';
import {
  type CurveConfigSet,
  DEFAULT_CURVE_PARAMS,
  DEFAULT_RANGE,
  CONFIG_COLORS,
  createConfigSet,
} from './curveSimConfig';
import CurveGraph from './CurveGraph';
import CurveParameterForm from './CurveParameterForm';
import CurvePresets from './CurvePresets';
import CurveCalculationSteps from './CurveCalculationSteps';
import CurveComparisonTable from './CurveComparisonTable';

interface CurveSimClientProps {
  lang: string;
  version: string;
}

/** URLパラメータの型 */
interface UrlParams {
  configs: Array<{
    name: string;
    start: number;
    step: number;
    rate: number;
  }>;
  rangeStart: number;
  rangeEnd: number;
}

function CurveSimContent({ lang, version }: CurveSimClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 設定リスト
  const [configs, setConfigs] = useState<CurveConfigSet[]>(() => [
    createConfigSet(0, DEFAULT_CURVE_PARAMS),
  ]);

  // 入力範囲
  const [rangeStart, setRangeStart] = useState(DEFAULT_RANGE.start);
  const [rangeEnd, setRangeEnd] = useState(DEFAULT_RANGE.end);

  // スナックバー
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // URLからパラメータを復元
  useEffect(() => {
    const configsParam = searchParams.get('configs');
    const rangeStartParam = searchParams.get('rangeStart');
    const rangeEndParam = searchParams.get('rangeEnd');

    if (configsParam) {
      try {
        const parsed = JSON.parse(configsParam) as UrlParams['configs'];
        const restoredConfigs = parsed.map((c, index) => ({
          id: `config-restored-${index}`,
          name: c.name,
          params: { start: c.start, step: c.step, rate: c.rate },
          color: CONFIG_COLORS[index % CONFIG_COLORS.length],
        }));
        if (restoredConfigs.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with external URL state
          setConfigs(restoredConfigs);
        }
      } catch {
        // パースエラーは無視
      }
    }

    if (rangeStartParam) {
      const num = parseInt(rangeStartParam, 10);
      if (!isNaN(num)) setRangeStart(num);
    }

    if (rangeEndParam) {
      const num = parseInt(rangeEndParam, 10);
      if (!isNaN(num)) setRangeEnd(num);
    }
  }, [searchParams]);

  // URLを更新
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    const configsForUrl = configs.map((c) => ({
      name: c.name,
      start: c.params.start,
      step: c.params.step,
      rate: c.params.rate,
    }));
    params.set('configs', JSON.stringify(configsForUrl));
    params.set('rangeStart', rangeStart.toString());
    params.set('rangeEnd', rangeEnd.toString());

    // 現在のURLパラメータと比較して、同じなら更新をスキップ
    const currentConfigs = searchParams.get('configs');
    const currentRangeStart = searchParams.get('rangeStart');
    const currentRangeEnd = searchParams.get('rangeEnd');

    if (
      currentConfigs === params.get('configs') &&
      currentRangeStart === params.get('rangeStart') &&
      currentRangeEnd === params.get('rangeEnd')
    ) {
      return;
    }

    const newUrl = `/${lang}/${version}/sim/curve?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [configs, rangeStart, rangeEnd, lang, version, router, searchParams]);

  // 設定変更時にURLを更新
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // 設定を追加
  const handleAddConfig = () => {
    if (configs.length >= CONFIG_COLORS.length) return;
    const newConfig = createConfigSet(configs.length, DEFAULT_CURVE_PARAMS);
    setConfigs([...configs, newConfig]);
  };

  // 設定を削除
  const handleDeleteConfig = (id: string) => {
    setConfigs(configs.filter((c) => c.id !== id));
  };

  // 設定を更新
  const handleUpdateConfig = (updatedConfig: CurveConfigSet) => {
    setConfigs(
      configs.map((c) => (c.id === updatedConfig.id ? updatedConfig : c))
    );
  };

  // プリセット選択
  const handleSelectPreset = (params: CurveParams, presetName: string) => {
    if (configs.length > 0) {
      const updatedConfig = {
        ...configs[0],
        params,
        name: presetName,
      };
      handleUpdateConfig(updatedConfig);
    }
  };

  // 設定をクリア
  const handleClearConfigs = () => {
    setConfigs([createConfigSet(0, DEFAULT_CURVE_PARAMS)]);
  };

  // URLをコピー
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setSnackbarOpen(true);
  };

  // 範囲変更
  const handleRangeStartChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num < rangeEnd) {
      setRangeStart(num);
    }
  };

  const handleRangeEndChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > rangeStart) {
      setRangeEnd(num);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ChartIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.curveSim.title}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t.curveSim.description}
        </Typography>

        {/* プリセットとURL共有 */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <CurvePresets onSelectPreset={handleSelectPreset} />
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyUrl}
            size="small"
          >
            {t.curveSim.copyUrl}
          </Button>
        </Box>

        {/* 入力範囲 */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t.curveSim.inputRange}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label={t.curveSim.rangeStart}
              type="number"
              size="small"
              value={rangeStart}
              onChange={(e) => handleRangeStartChange(e.target.value)}
              sx={{ width: 120 }}
              slotProps={{
                htmlInput: { min: 0 },
              }}
            />
            <Typography>〜</Typography>
            <TextField
              label={t.curveSim.rangeEnd}
              type="number"
              size="small"
              value={rangeEnd}
              onChange={(e) => handleRangeEndChange(e.target.value)}
              sx={{ width: 120 }}
              slotProps={{
                htmlInput: { min: 1 },
              }}
            />
          </Box>
        </Paper>

        {/* パラメータ設定 */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">{t.curveSim.parameters}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddConfig}
                disabled={configs.length >= CONFIG_COLORS.length}
                size="small"
              >
                {t.curveSim.addConfig}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearConfigs}
                size="small"
                color="secondary"
              >
                {t.curveSim.clearConfigs}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {configs.map((config) => (
              <CurveParameterForm
                key={config.id}
                config={config}
                onChange={handleUpdateConfig}
                showDelete={configs.length > 1}
                onDelete={() => handleDeleteConfig(config.id)}
              />
            ))}
          </Box>
        </Paper>

        {/* グラフ */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t.curveSim.graph}
          </Typography>
          <CurveGraph
            configs={configs}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
          />
        </Paper>

        {/* 単一値計算 */}
        {configs.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <CurveCalculationSteps params={configs[0].params} />
          </Box>
        )}

        {/* 数値テーブル */}
        <CurveComparisonTable
          configs={configs}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
        />
      </Box>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {t.curveSim.urlCopied}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function CurveSimClient(props: CurveSimClientProps) {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div>{t.common.loading}...</div>}>
      <CurveSimContent {...props} />
    </Suspense>
  );
}
