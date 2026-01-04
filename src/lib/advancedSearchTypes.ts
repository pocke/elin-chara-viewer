// 数値型演算子
export type NumericOperator =
  | '>='
  | '<='
  | '='
  | '!='
  | '>'
  | '<'
  | 'between'
  | 'empty'
  | 'not_empty';

// 文字列型演算子
export type StringOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'empty'
  | 'not_empty';

// 全演算子
export type SearchOperator = NumericOperator | StringOperator;

// 検索条件
export interface SearchCondition {
  id: string;
  field: string;
  operator: SearchOperator;
  value: string | number | [number, number]; // between用に配列も許容
}

// 条件グループ（再帰的にネスト可能）
export interface ConditionGroup {
  id: string;
  type: 'group';
  logic: 'AND' | 'OR';
  conditions: SearchConditionOrGroup[];
}

// 条件またはグループ
export type SearchConditionOrGroup = SearchCondition | ConditionGroup;

// 高度検索の状態
export interface AdvancedSearchState {
  enabled: boolean;
  logic: 'AND' | 'OR';
  conditions: SearchConditionOrGroup[];
}

// フィールド情報
export interface FieldInfo {
  key: string;
  displayName: string;
  nameJa: string;
  nameEn: string;
  type: 'number' | 'string';
  category: FieldCategory;
  options?: FieldOption[]; // 選択肢がある場合
}

export type FieldCategory =
  | 'keyInfo'
  | 'stats'
  | 'attributes'
  | 'skills'
  | 'resistances'
  | 'tactics'
  | 'raw';

export interface FieldOption {
  key: string;
  displayName: string;
  nameJa: string;
  nameEn: string;
}

// 条件がグループかどうかを判定する型ガード
export function isConditionGroup(
  condition: SearchConditionOrGroup
): condition is ConditionGroup {
  return 'type' in condition && condition.type === 'group';
}

// 数値演算子かどうかを判定
export function isNumericOperator(
  operator: SearchOperator
): operator is NumericOperator {
  return [
    '>=',
    '<=',
    '=',
    '!=',
    '>',
    '<',
    'between',
    'empty',
    'not_empty',
  ].includes(operator);
}

// 文字列演算子かどうかを判定
export function isStringOperator(
  operator: SearchOperator
): operator is StringOperator {
  return [
    'contains',
    'not_contains',
    'equals',
    'not_equals',
    'starts_with',
    'ends_with',
    'empty',
    'not_empty',
  ].includes(operator);
}

// 数値型フィールド用の演算子リスト
export const NUMERIC_OPERATORS: NumericOperator[] = [
  '>=',
  '<=',
  '=',
  '!=',
  '>',
  '<',
  'between',
  'empty',
  'not_empty',
];

// 文字列型フィールド用の演算子リスト
export const STRING_OPERATORS: StringOperator[] = [
  'contains',
  'not_contains',
  'equals',
  'not_equals',
  'starts_with',
  'ends_with',
  'empty',
  'not_empty',
];

// 空の高度検索状態を作成
export function createEmptyAdvancedSearchState(): AdvancedSearchState {
  return {
    enabled: false,
    logic: 'AND',
    conditions: [],
  };
}

// ユニークIDを生成
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// 新しい条件を作成
export function createNewCondition(
  field: string = '',
  operator: SearchOperator = '=',
  value: string | number | [number, number] = ''
): SearchCondition {
  return {
    id: generateId(),
    field,
    operator,
    value,
  };
}

// 新しいグループを作成
export function createNewGroup(logic: 'AND' | 'OR' = 'AND'): ConditionGroup {
  return {
    id: generateId(),
    type: 'group',
    logic,
    conditions: [],
  };
}

// 条件から選択されているフィールドを抽出（再帰的）
export function extractSelectedFields(state: AdvancedSearchState): Set<string> {
  const fields = new Set<string>();

  function extractFromConditions(conditions: SearchConditionOrGroup[]) {
    for (const condition of conditions) {
      if (isConditionGroup(condition)) {
        extractFromConditions(condition.conditions);
      } else if (condition.field) {
        fields.add(condition.field);
      }
    }
  }

  extractFromConditions(state.conditions);
  return fields;
}
