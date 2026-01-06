import {
  AdvancedSearchState,
  SearchCondition,
  ConditionGroup,
  SearchConditionOrGroup,
  FieldInfo,
  FieldCategory,
  FieldOption,
  isConditionGroup,
  SearchOperator,
  generateId,
} from './advancedSearchTypes';
import { Chara } from './models/chara';
import { GameVersion } from './db';
import {
  resistanceElements,
  skillElements,
  elementByAlias,
  PRIMARY_ATTRIBUTE_ALIASES,
  STATS_ALIASES,
} from './models/element';
import { normalizeForSearch } from './searchUtils';

// Tactics列フィールド
export const TACTICS_FIELDS = [
  'tacticsName',
  'tacticsDistance',
  'tacticsMoveFrequency',
  'tacticsParty',
  'tacticsTaunt',
  'tacticsMelee',
  'tacticsRange',
  'tacticsSpell',
  'tacticsHeal',
  'tacticsSummon',
  'tacticsBuff',
  'tacticsDebuff',
  'tacticsPartyBuff',
] as const;

// 生データフィールドの情報
export interface RawFieldsInfo {
  charaFields: string[];
  charaNumericFields: Set<string>;
  raceFields: string[];
  raceNumericFields: Set<string>;
  jobFields: string[];
  jobNumericFields: Set<string>;
  tacticsFields: string[];
  tacticsNumericFields: Set<string>;
}

// フィールド情報のリストを取得
export function getFieldInfoList(
  language: string,
  version: GameVersion,
  charas: Chara[],
  t: {
    advancedSearch: {
      categoryKeyInfo: string;
      categoryStats: string;
      categoryAttributes: string;
      categorySkills: string;
      categoryResistances: string;
      categoryTactics: string;
      categoryRaw: string;
    };
    common: Record<string, string>;
  },
  rawFieldsInfo?: RawFieldsInfo
): FieldInfo[] {
  const fields: FieldInfo[] = [];

  // Key Info fields
  const keyInfoFields: Array<{
    key: string;
    type: 'number' | 'string';
    options?: () => FieldOption[];
  }> = [
    { key: 'name', type: 'string' },
    {
      key: 'race',
      type: 'string',
      options: () => getUniqueRaceOptions(charas, language),
    },
    {
      key: 'job',
      type: 'string',
      options: () => getUniqueJobOptions(charas, language),
    },
    {
      key: 'mainElement',
      type: 'string',
      options: () => getUniqueMainElementOptions(charas, language),
    },
    { key: 'level', type: 'number' },
    { key: 'geneSlot', type: 'number' },
    { key: 'bodyParts', type: 'number' },
  ];

  keyInfoFields.forEach(({ key, type, options }) => {
    fields.push({
      key,
      displayName: t.common[key] || key,
      nameJa: key,
      nameEn: key,
      type,
      category: 'keyInfo',
      options: options?.(),
    });
  });

  // Stats fields
  STATS_ALIASES.forEach((key) => {
    fields.push({
      key,
      displayName: t.common[key] || key,
      nameJa: key,
      nameEn: key,
      type: 'number',
      category: 'stats',
    });
  });

  // Primary attributes
  PRIMARY_ATTRIBUTE_ALIASES.forEach((alias) => {
    const element = elementByAlias(version, alias);
    fields.push({
      key: alias,
      displayName: element?.name(language) || alias,
      nameJa: element?.name('ja') || alias,
      nameEn: element?.name('en') || alias,
      type: 'number',
      category: 'attributes',
    });
  });

  // Skills
  const skills = skillElements(version);
  skills.forEach((skill) => {
    fields.push({
      key: skill.alias,
      displayName: skill.name(language),
      nameJa: skill.name('ja'),
      nameEn: skill.name('en'),
      type: 'number',
      category: 'skills',
    });
  });

  // Resistances
  const resistances = resistanceElements(version);
  resistances.forEach((res) => {
    fields.push({
      key: res.alias,
      displayName: res.name(language),
      nameJa: res.name('ja'),
      nameEn: res.name('en'),
      type: 'number',
      category: 'resistances',
    });
  });

  // Tactics fields
  // 文字列型のtacticsフィールド
  const tacticsStringFields: ReadonlyArray<(typeof TACTICS_FIELDS)[number]> = [
    'tacticsName',
    'tacticsPartyBuff',
  ];
  TACTICS_FIELDS.forEach((key) => {
    const type = tacticsStringFields.includes(key) ? 'string' : 'number';
    fields.push({
      key,
      displayName: t.common[key] || key,
      nameJa: key,
      nameEn: key,
      type,
      category: 'tactics',
    });
  });

  // Raw data fields
  if (rawFieldsInfo) {
    // Chara raw fields
    rawFieldsInfo.charaFields.forEach((key) => {
      const fieldKey = `chara.${key}`;
      fields.push({
        key: fieldKey,
        displayName: fieldKey,
        nameJa: fieldKey,
        nameEn: fieldKey,
        type: rawFieldsInfo.charaNumericFields.has(key) ? 'number' : 'string',
        category: 'raw',
      });
    });

    // Race raw fields
    rawFieldsInfo.raceFields.forEach((key) => {
      const fieldKey = `race.${key}`;
      fields.push({
        key: fieldKey,
        displayName: fieldKey,
        nameJa: fieldKey,
        nameEn: fieldKey,
        type: rawFieldsInfo.raceNumericFields.has(key) ? 'number' : 'string',
        category: 'raw',
      });
    });

    // Job raw fields
    rawFieldsInfo.jobFields.forEach((key) => {
      const fieldKey = `job.${key}`;
      fields.push({
        key: fieldKey,
        displayName: fieldKey,
        nameJa: fieldKey,
        nameEn: fieldKey,
        type: rawFieldsInfo.jobNumericFields.has(key) ? 'number' : 'string',
        category: 'raw',
      });
    });

    // Tactics raw fields
    rawFieldsInfo.tacticsFields.forEach((key) => {
      const fieldKey = `tactics.${key}`;
      fields.push({
        key: fieldKey,
        displayName: fieldKey,
        nameJa: fieldKey,
        nameEn: fieldKey,
        type: rawFieldsInfo.tacticsNumericFields.has(key) ? 'number' : 'string',
        category: 'raw',
      });
    });
  }

  return fields;
}

// 種族のユニークオプションを取得
function getUniqueRaceOptions(
  charas: Chara[],
  language: string
): FieldOption[] {
  const raceMap = new Map<string, FieldOption>();
  charas.forEach((chara) => {
    if (!raceMap.has(chara.race.id)) {
      raceMap.set(chara.race.id, {
        key: chara.race.name(language),
        displayName: chara.race.name(language),
        nameJa: chara.race.name('ja'),
        nameEn: chara.race.name('en'),
      });
    }
  });
  return Array.from(raceMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

// 職業のユニークオプションを取得
function getUniqueJobOptions(charas: Chara[], language: string): FieldOption[] {
  const jobMap = new Map<string, FieldOption>();
  charas.forEach((chara) => {
    const job = chara.job();
    if (!jobMap.has(job.id)) {
      jobMap.set(job.id, {
        key: job.name(language),
        displayName: job.name(language),
        nameJa: job.name('ja'),
        nameEn: job.name('en'),
      });
    }
  });
  return Array.from(jobMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

// 主属性のユニークオプションを取得
function getUniqueMainElementOptions(
  charas: Chara[],
  language: string
): FieldOption[] {
  const elementMap = new Map<string, FieldOption>();
  charas.forEach((chara) => {
    if (chara.mainElement) {
      const name = chara.mainElement.name(language);
      if (!elementMap.has(name)) {
        elementMap.set(name, {
          key: name,
          displayName: name,
          nameJa: chara.mainElement.name('ja'),
          nameEn: chara.mainElement.name('en'),
        });
      }
    }
  });
  return Array.from(elementMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

// カテゴリ名を取得
export function getCategoryName(
  category: FieldCategory,
  t: {
    advancedSearch: {
      categoryKeyInfo: string;
      categoryStats: string;
      categoryAttributes: string;
      categorySkills: string;
      categoryResistances: string;
      categoryTactics: string;
      categoryRaw: string;
    };
  }
): string {
  const categoryNames: Record<FieldCategory, string> = {
    keyInfo: t.advancedSearch.categoryKeyInfo,
    stats: t.advancedSearch.categoryStats,
    attributes: t.advancedSearch.categoryAttributes,
    skills: t.advancedSearch.categorySkills,
    resistances: t.advancedSearch.categoryResistances,
    tactics: t.advancedSearch.categoryTactics,
    raw: t.advancedSearch.categoryRaw,
  };
  return categoryNames[category];
}

// rowからフィールドの値を取得
export function getFieldValue(
  row: Record<string, unknown>,
  fieldKey: string
): string | number | null {
  if (fieldKey in row) {
    const value = row[fieldKey];
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return value as string | number;
  }
  return null;
}

// 条件が完成しているか（フィールドと値が入力されているか）を確認
function isConditionComplete(condition: SearchCondition): boolean {
  // フィールドが未選択の場合は未完成
  if (!condition.field) {
    return false;
  }

  // empty/not_emptyの場合は値不要
  if (condition.operator === 'empty' || condition.operator === 'not_empty') {
    return true;
  }

  // betweenの場合は両方の値が入力されているか確認
  // 0は有効な値なので、初期値（両方0）の場合のみ未完成とみなす
  if (condition.operator === 'between') {
    return (
      Array.isArray(condition.value) &&
      condition.value.length === 2 &&
      !(condition.value[0] === 0 && condition.value[1] === 0)
    );
  }

  // 値が空の場合は未完成
  if (condition.value === '' || condition.value === null) {
    return false;
  }

  return true;
}

// 単一の条件を評価
export function evaluateCondition(
  row: Record<string, unknown>,
  condition: SearchCondition
): boolean {
  // 未完成の条件は全てにマッチ
  if (!isConditionComplete(condition)) {
    return true;
  }

  const value = getFieldValue(row, condition.field);
  const { operator, value: targetValue } = condition;

  // empty/not_empty演算子の処理（0は空でないとして扱う）
  if (operator === 'empty') {
    return value === null || value === '';
  }
  if (operator === 'not_empty') {
    return value !== null && value !== '';
  }

  // 数値演算子の場合、nullは0として扱う
  const numericOperators = ['>=', '<=', '=', '!=', '>', '<', 'between'];
  if (numericOperators.includes(operator)) {
    const numValue = value === null ? 0 : (value as number);
    const numTarget =
      typeof targetValue === 'number'
        ? targetValue
        : parseFloat(String(targetValue));

    if (isNaN(numTarget) && operator !== 'between') {
      return false;
    }

    switch (operator) {
      case '>=':
        return numValue >= numTarget;
      case '<=':
        return numValue <= numTarget;
      case '=':
        return numValue === numTarget;
      case '!=':
        return numValue !== numTarget;
      case '>':
        return numValue > numTarget;
      case '<':
        return numValue < numTarget;
      case 'between':
        if (Array.isArray(targetValue) && targetValue.length === 2) {
          return numValue >= targetValue[0] && numValue <= targetValue[1];
        }
        return false;
      default:
        return false;
    }
  }

  // 値がnullの場合は文字列演算子では一致しない
  if (value === null) {
    return false;
  }

  // 文字列演算子
  if (typeof value === 'string') {
    const strTarget = String(targetValue);
    const normalizedValue = normalizeForSearch(value);
    const normalizedTarget = normalizeForSearch(strTarget);

    switch (operator) {
      case 'contains':
        return normalizedValue.includes(normalizedTarget);
      case 'not_contains':
        return !normalizedValue.includes(normalizedTarget);
      case 'equals':
        return normalizedValue === normalizedTarget;
      case 'not_equals':
        return normalizedValue !== normalizedTarget;
      case 'starts_with':
        return normalizedValue.startsWith(normalizedTarget);
      case 'ends_with':
        return normalizedValue.endsWith(normalizedTarget);
      default:
        return false;
    }
  }

  return false;
}

// 条件グループを評価（再帰的）
export function evaluateConditionGroup(
  row: Record<string, unknown>,
  group: ConditionGroup
): boolean {
  if (group.conditions.length === 0) {
    return true;
  }

  const results = group.conditions.map((condition) =>
    evaluateConditionOrGroup(row, condition)
  );

  if (group.logic === 'AND') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

// 条件またはグループを評価
export function evaluateConditionOrGroup(
  row: Record<string, unknown>,
  condition: SearchConditionOrGroup
): boolean {
  if (isConditionGroup(condition)) {
    return evaluateConditionGroup(row, condition);
  } else {
    return evaluateCondition(row, condition);
  }
}

// 高度検索全体を評価
// enabledはアコーディオンの開閉状態を示すだけで、条件があれば常に適用される
export function evaluateAdvancedSearch(
  row: Record<string, unknown>,
  state: AdvancedSearchState
): boolean {
  if (state.conditions.length === 0) {
    return true;
  }

  const results = state.conditions.map((condition) =>
    evaluateConditionOrGroup(row, condition)
  );

  if (state.logic === 'AND') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

// URLパラメータにシリアライズ
// enabledはアコーディオンの開閉状態を示すだけで、条件があればシリアライズする
export function serializeAdvancedSearch(state: AdvancedSearchState): string {
  if (state.conditions.length === 0) {
    return '';
  }

  const compactState = {
    l: state.logic,
    c: state.conditions.map(serializeConditionOrGroup),
  };

  try {
    const json = JSON.stringify(compactState);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

function serializeConditionOrGroup(
  condition: SearchConditionOrGroup
): Record<string, unknown> {
  if (isConditionGroup(condition)) {
    return {
      t: 'g',
      l: condition.logic,
      c: condition.conditions.map(serializeConditionOrGroup),
    };
  } else {
    return {
      f: condition.field,
      o: condition.operator,
      v: condition.value,
    };
  }
}

// URLパラメータからデシリアライズ
export function deserializeAdvancedSearch(
  param: string
): AdvancedSearchState | null {
  if (!param) {
    return null;
  }

  try {
    const json = decodeURIComponent(atob(param));
    const compact = JSON.parse(json) as {
      l: 'AND' | 'OR';
      c: Array<Record<string, unknown>>;
    };

    return {
      enabled: true,
      logic: compact.l,
      conditions: compact.c.map(deserializeConditionOrGroup),
    };
  } catch {
    return null;
  }
}

function deserializeConditionOrGroup(
  data: Record<string, unknown>
): SearchConditionOrGroup {
  if (data.t === 'g') {
    return {
      id: generateId(),
      type: 'group',
      logic: data.l as 'AND' | 'OR',
      conditions: (data.c as Array<Record<string, unknown>>).map(
        deserializeConditionOrGroup
      ),
    };
  } else {
    return {
      id: generateId(),
      field: data.f as string,
      operator: data.o as SearchOperator,
      value: data.v as string | number | [number, number],
    };
  }
}
