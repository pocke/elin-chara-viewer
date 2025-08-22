'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 既存のresourcesをそのまま使用
const resources = {
  ja: {
    common: {
      title: 'Elin キャラクタービューア',
      welcome: 'キャラクターデータベースへようこそ',
      allCharacters: '全キャラクター',
      charactersCount: '{{count}}キャラクターを参照',
      name: '名前',
      id: 'ID',
      characterName: 'キャラクター名',
      japaneseName: '日本語名',
      characterId: 'キャラクターID',
      race: '種族',
      level: 'レベル',
      feats: 'フィート',
      bodyParts: '部位',
      hand: '手',
      head: '頭',
      torso: '胴',
      back: '背中',
      waist: '腰',
      arm: '腕',
      foot: '足',
      neck: '首',
      finger: '指',
      stats: 'ステータス',
      life: '生命',
      mana: 'マナ',
      speed: '速度',
      vigor: '活力',
      abilities: 'アビリティ',
      range: '範囲',
      geneSlot: '遺伝子スロット',
      geneSlotShort: '遺伝子',
      dv: 'DV',
      pv: 'PV',
      pdr: '物理軽減',
      pdrShort: 'PDR',
      edr: '属性軽減',
      edrShort: 'EDR',
      ep: '完全回避',
      epShort: 'EP',
      defenseStats: '防御ステータス',
      resistances: '耐性',
      statusResistances: '状態異常耐性',
      resistanceDefect: '致命的な弱点',
      resistanceWeakness: '弱点',
      resistanceNone: 'なし',
      resistanceNoneCount: '耐性なし ({{count}}個)',
      resistanceNormal: '耐性',
      resistanceStrong: '強い耐性',
      resistanceSuperb: '素晴らしい耐性',
      resistanceImmunity: '免疫',
      backToCharacters: 'キャラクター一覧に戻る',
      gettingStarted: 'はじめに',
      appDescription:
        'このアプリケーションでは、Elinのキャラクター情報を閲覧・管理できます。',
      browseCharacters: 'キャラクターを見る',
      viewDocumentation: 'ドキュメントを見る',
      searchCharacters: 'キャラクターを検索',
      searchFeats: 'フィートを検索',
      searchAbilities: 'アビリティを検索',
      filters: 'フィルター',
      columnVisibility: 'カラムの表示',
      statusColumns: 'ステータス',
    },
  },
  en: {
    common: {
      title: 'Elin Character Viewer',
      welcome: 'Welcome to your character database',
      allCharacters: 'All Characters',
      charactersCount: 'Browse through {{count}} characters',
      name: 'Name',
      id: 'ID',
      characterName: 'Character Name',
      japaneseName: 'Japanese Name',
      characterId: 'Character ID',
      race: 'Race',
      level: 'Level',
      feats: 'Feats',
      bodyParts: 'Body Parts',
      hand: 'Hand',
      head: 'Head',
      torso: 'Torso',
      back: 'Back',
      waist: 'Waist',
      arm: 'Arm',
      foot: 'Foot',
      neck: 'Neck',
      finger: 'Finger',
      stats: 'Stats',
      life: 'Life',
      mana: 'Mana',
      speed: 'Speed',
      vigor: 'Vigor',
      abilities: 'Abilities',
      range: 'Range',
      geneSlot: 'Gene Slot',
      geneSlotShort: 'Gene',
      dv: 'DV',
      pv: 'PV',
      pdr: 'Physical Damage Reduction',
      pdrShort: 'PDR',
      edr: 'Elemental Damage Reduction',
      edrShort: 'EDR',
      ep: 'Evasion Perfection',
      epShort: 'EP',
      defenseStats: 'Defense Stats',
      resistances: 'Resistances',
      statusResistances: 'Status Resistances',
      resistanceDefect: 'Defect',
      resistanceWeakness: 'Weakness',
      resistanceNone: 'None',
      resistanceNoneCount: 'No resistances ({{count}} items)',
      resistanceNormal: 'Normal',
      resistanceStrong: 'Strong',
      resistanceSuperb: 'Superb',
      resistanceImmunity: 'Immunity',
      backToCharacters: 'Back to Characters',
      gettingStarted: 'Getting Started',
      appDescription:
        'This application allows you to browse and manage character information for Elin.',
      browseCharacters: 'Browse Characters',
      viewDocumentation: 'View Documentation',
      searchCharacters: 'Search characters',
      searchFeats: 'Search feats',
      searchAbilities: 'Search abilities',
      filters: 'Filters',
      columnVisibility: 'Column Display',
      statusColumns: 'Status Columns',
    },
  },
};

export type Language = 'ja' | 'en';
export type Resources = typeof resources;
export type Translations = Resources[Language];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({
  children,
  initialLanguage = 'ja',
}: LanguageProviderProps): React.JSX.Element {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  return (
    <LanguageContext value={{ language, setLanguage }}>
      {children}
    </LanguageContext>
  );
}

export function useTranslation(): { t: Translations; language: Language } {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { language } = context;
  return { t: resources[language], language };
}

export { resources };
