export type SupportedLanguage = 
  | 'vi'
  | 'en'
  | 'en-GB'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'fr'
  | 'de'
  | 'es'
  | 'th'
  | 'pt'
  | 'id'
  | 'ru'
  | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string; // Native name
  label: string; // Vietnamese label
  flag: string; // Flag icon emoji
  locale: string; // Standard BCP-47 locale tag
  sampleText: string; // Sample speech sentence for TTS test
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'vi',
    name: 'Tiếng Việt',
    label: 'Tiếng Việt (Việt Nam)',
    flag: '🇻🇳',
    locale: 'vi-VN',
    sampleText: 'Chào mừng bạn đến với studio sáng tạo video AI chất lượng cao.',
  },
  {
    code: 'en',
    name: 'English (US)',
    label: 'Tiếng Anh (Mỹ)',
    flag: '🇺🇸',
    locale: 'en-US',
    sampleText: 'Welcome to the next generation of AI-powered cinematic video creation.',
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    label: 'Tiếng Anh (Anh)',
    flag: '🇬🇧',
    locale: 'en-GB',
    sampleText: 'Explore remarkable stories and captivating documentaries from across the globe.',
  },
  {
    code: 'ja',
    name: '日本語',
    label: 'Tiếng Nhật',
    flag: '🇯🇵',
    locale: 'ja-JP',
    sampleText: 'AI動画制作スタジオへようこそ。美しい映像と音声をお楽しみください。',
  },
  {
    code: 'ko',
    name: '한국어',
    label: 'Tiếng Hàn',
    flag: '🇰🇷',
    locale: 'ko-KR',
    sampleText: '차세대 AI 비디오 스튜디오에 오신 것을 환영합니다. 멋진 영상을 만들어보세요.',
  },
  {
    code: 'zh',
    name: '中文 (普通话)',
    label: 'Tiếng Trung (Phổ thông)',
    flag: '🇨🇳',
    locale: 'zh-CN',
    sampleText: '欢迎使用新一代AI视频生成工作室，体验震撼的视听创作。',
  },
  {
    code: 'fr',
    name: 'Français',
    label: 'Tiếng Pháp',
    flag: '🇫🇷',
    locale: 'fr-FR',
    sampleText: 'Bienvenue dans le studio de création vidéo et de voix off assisté par IA.',
  },
  {
    code: 'de',
    name: 'Deutsch',
    label: 'Tiếng Đức',
    flag: '🇩🇪',
    locale: 'de-DE',
    sampleText: 'Willkommen im AI-Videostudio für professionelle filmische Geschichten.',
  },
  {
    code: 'es',
    name: 'Español',
    label: 'Tiếng Tây Ban Nha',
    flag: '🇪🇸',
    locale: 'es-ES',
    sampleText: 'Bienvenido al estudio de creación de video cinematográfico con inteligencia artificial.',
  },
  {
    code: 'th',
    name: 'ภาษาไทย',
    label: 'Tiếng Thái',
    flag: '🇹🇭',
    locale: 'th-TH',
    sampleText: 'ยินดีต้อนรับสู่สตูดิโอสร้างวิดีโอและเสียงพากย์ด้วยระบบ AI คุณภาพสูง',
  },
  {
    code: 'pt',
    name: 'Português',
    label: 'Tiếng Bồ Đào Nha',
    flag: '🇧🇷',
    locale: 'pt-BR',
    sampleText: 'Bem-vindo ao estúdio de criação de vídeos e narração com inteligência artificial.',
  },
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    label: 'Tiếng Indonesia',
    flag: '🇮🇩',
    locale: 'id-ID',
    sampleText: 'Selamat datang di studio pembuatan video dan suara narasi berbasis AI.',
  },
  {
    code: 'ru',
    name: 'Русский',
    label: 'Tiếng Nga',
    flag: '🇷🇺',
    locale: 'ru-RU',
    sampleText: 'Добро пожаловать в студию создания видео и озвучки на базе искусственного интеллекта.',
  },
  {
    code: 'it',
    name: 'Italiano',
    label: 'Tiếng Ý',
    flag: '🇮🇹',
    locale: 'it-IT',
    sampleText: 'Benvenuti nello studio di creazione video e doppiaggio cinematografico con IA.',
  },
];

export function getLanguageOption(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
