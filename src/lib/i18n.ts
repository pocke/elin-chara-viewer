'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
      backToCharacters: 'キャラクター一覧に戻る',
      gettingStarted: 'はじめに',
      appDescription:
        'このアプリケーションでは、Elinのキャラクター情報を閲覧・管理できます。',
      browseCharacters: 'キャラクターを見る',
      viewDocumentation: 'ドキュメントを見る',
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
      backToCharacters: 'Back to Characters',
      gettingStarted: 'Getting Started',
      appDescription:
        'This application allows you to browse and manage character information for Elin.',
      browseCharacters: 'Browse Characters',
      viewDocumentation: 'View Documentation',
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'ja',
    fallbackLng: 'ja',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
