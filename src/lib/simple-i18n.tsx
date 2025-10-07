'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 既存のresourcesをそのまま使用
const resources = {
  ja: {
    common: {
      title: 'Elin キャラクタービューワー',
      welcome: 'キャラクターデータベースへようこそ',
      allCharacters: '全キャラクター',
      name: '名前',
      id: 'ID',
      characterName: 'キャラクター名',
      japaneseName: '日本語名',
      characterId: 'キャラクターID',
      race: '種族',
      job: '職業',
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
      importantInfo: 'Note',
      appDescription:
        'このアプリケーションは、Elinの非公式キャラクタービューワーです。ゲームの解析データを元にキャラクターの情報を表示します。',
      versionInfo:
        'バージョンは {{version}} です。将来的にNightlyにも対応する予定です。',
      internalDataNotice: 'キャラクターの一覧には内部データも含まれています。',
      bugReportPrefix: '不具合報告は ',
      bugReportGitHub: 'GitHub レポジトリ',
      bugReportSuffix:
        ' もしくは Elin コミュニティの Discord で pocke までお願いします。',
      browseCharacters: 'キャラクター一覧',
      browseFeats: 'フィート一覧',
      searchCharacters: '名前',
      filters: 'フィルター',
      clearFilters: 'フィルターをクリア',
      tactics: '戦闘タイプ',
      tacticsName: '戦闘タイプ名',
      tacticsDistance: '距離',
      tacticsMoveFrequency: '移動頻度',
      loading: '読み込み中',
      showHiddenCharacters: '通常ゲームでは登場しないキャラを表示',
      rawData: '生データ',
      charaRawData: 'キャラクター生データ',
      raceRawData: '種族生データ',
      jobRawData: '職業生データ',
      featRawData: 'フィート生データ',
      backToFeats: 'フィート一覧に戻る',
      description: '説明',
      flavorText: 'フレーバーテキスト',
      effects: '効果',
      basicInfo: '基本情報',
    },
    feat: {
      geneSlot: '使用スロット数',
      max: '重ね合わせ上限',
      textExtra: '説明',
      canDropAsGene: '遺伝子化',
      yes: 'true',
      no: 'false',
      racesWithFeat: 'このフィートを持つ種族',
      jobsWithFeat: 'このフィートを持つ職業',
      charactersWithFeat: 'このフィートを持つキャラクター',
      none: 'なし',
      searchCharactersWithFeat: '{{featName}}を持つキャラクターを検索する',
    },
    footer: {
      lastUpdated: '最終更新',
      github: 'GitHub',
    },
  },
  en: {
    common: {
      title: 'Elin Character Viewer',
      welcome: 'Welcome to your character database',
      allCharacters: 'All Characters',
      name: 'Name',
      id: 'ID',
      characterName: 'Character Name',
      japaneseName: 'Japanese Name',
      characterId: 'Character ID',
      race: 'Race',
      job: 'Class',
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
      importantInfo: 'Note',
      appDescription:
        'This application is an unofficial character viewer for Elin. It displays character information based on game data analysis.',
      versionInfo:
        'Version is {{version}}. We plan to support Nightly builds in the future.',
      internalDataNotice: 'The character list includes internal data.',
      bugReportPrefix: 'Please report bugs to the ',
      bugReportGitHub: 'GitHub repository',
      bugReportSuffix: ' or contact pocke on the Elin community Discord.',
      browseCharacters: 'Browse Characters',
      browseFeats: 'Browse Feats',
      searchCharacters: 'Name',
      filters: 'Filters',
      clearFilters: 'Clear Filters',
      tactics: 'Tactics',
      tacticsName: 'Tactics Name',
      tacticsDistance: 'Distance',
      tacticsMoveFrequency: 'Move Frequency',
      loading: 'Loading',
      showHiddenCharacters: 'Show characters not appearing in regular gameplay',
      rawData: 'Raw Data',
      charaRawData: 'Character Raw Data',
      raceRawData: 'Race Raw Data',
      jobRawData: 'Job Raw Data',
      featRawData: 'Feat Raw Data',
      backToFeats: 'Back to Feats',
      description: 'Description',
      flavorText: 'Flavor Text',
      effects: 'Effects',
      basicInfo: 'Basic Info',
    },
    feat: {
      geneSlot: 'Slot Count',
      max: 'Stack Limit',
      textExtra: 'Description',
      canDropAsGene: 'Can Drop as Gene',
      yes: 'true',
      no: 'false',
      racesWithFeat: 'Races with this Feat',
      jobsWithFeat: 'Jobs with this Feat',
      charactersWithFeat: 'Characters with this Feat',
      none: 'None',
      searchCharactersWithFeat: 'Search characters with {{featName}}',
    },
    footer: {
      lastUpdated: 'Last Updated',
      github: 'GitHub',
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
