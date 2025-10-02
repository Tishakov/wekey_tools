// ============================================
// Email Builder Type Definitions
// ============================================

/**
 * Spacing (отступы)
 */
export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Типы макетов секций
 */
export type SectionLayout = 
  | '1col'           // Одна колонка (100%)
  | '2col-50-50'     // Две колонки (50% / 50%)
  | '2col-33-66'     // Две колонки (33% / 66%)
  | '2col-66-33'     // Две колонки (66% / 33%)
  | '3col'           // Три колонки (33% / 33% / 33%)
  | '4col';          // Четыре колонки (25% / 25% / 25% / 25%)

/**
 * Настройки секции
 */
export interface SectionSettings {
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: Spacing;
  margin?: Spacing;
  fullWidth?: boolean;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
}

/**
 * Настройки колонки
 */
export interface ColumnSettings {
  backgroundColor?: string;
  padding?: Spacing;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  borderRadius?: number;
}

/**
 * Типы блоков
 */
export type BlockType = 
  | 'text' 
  | 'heading'
  | 'image' 
  | 'button' 
  | 'divider' 
  | 'spacer'
  | 'social'
  | 'video'
  | 'html';

/**
 * Настройки блока
 */
export interface BlockSettings {
  padding?: Spacing;
  margin?: Spacing;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
}

/**
 * Контент текстового блока
 */
export interface TextBlockContent {
  text: string;
  fontSize?: number;
  color?: string;
  textType?: 'p' | 'h1' | 'h2' | 'h3';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

/**
 * Контент блока заголовка
 */
export interface HeadingBlockContent {
  text: string;
  level: 'h1' | 'h2' | 'h3';
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold';
}

/**
 * Контент блока изображения
 */
export interface ImageBlockContent {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  link?: string;
}

/**
 * Контент блока кнопки
 */
export interface ButtonBlockContent {
  text: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: string;
}

/**
 * Контент блока разделителя
 */
export interface DividerBlockContent {
  height?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Контент блока отступа
 */
export interface SpacerBlockContent {
  height: number;
}

/**
 * Контент блока соцсетей
 */
export interface SocialBlockContent {
  networks: Array<{
    name: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
    url: string;
  }>;
  iconSize?: number;
  spacing?: number;
}

/**
 * Блок письма
 */
export interface EmailBlock {
  id: string;
  type: BlockType;
  content: 
    | TextBlockContent 
    | HeadingBlockContent
    | ImageBlockContent 
    | ButtonBlockContent 
    | DividerBlockContent 
    | SpacerBlockContent
    | SocialBlockContent
    | any; // для кастомных типов
  settings: BlockSettings;
}

/**
 * Колонка секции
 */
export interface EmailColumn {
  id: string;
  width: number; // В процентах (100, 50, 33, 25, и т.д.)
  blocks: EmailBlock[];
  settings: ColumnSettings;
}

/**
 * Секция письма
 */
export interface EmailSection {
  id: string;
  type: 'section';
  layout: SectionLayout;
  settings: SectionSettings;
  columns: EmailColumn[];
}

/**
 * Глобальные стили письма
 */
export interface GlobalEmailStyles {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  linkColor: string;
  backgroundColor: string;
  contentWidth: number;
}

/**
 * Структура письма (новая архитектура с секциями)
 */
export interface NewsletterStructure {
  sections: EmailSection[];
  globalStyles: GlobalEmailStyles;
}

// ============================================
// Утилиты для работы с секциями
// ============================================

/**
 * Получить ширину колонок для заданного макета
 */
export function getColumnWidths(layout: SectionLayout): number[] {
  switch (layout) {
    case '1col':
      return [100];
    case '2col-50-50':
      return [50, 50];
    case '2col-33-66':
      return [33, 67];
    case '2col-66-33':
      return [67, 33];
    case '3col':
      return [33, 33, 34]; // Сумма должна быть 100%
    case '4col':
      return [25, 25, 25, 25];
    default:
      return [100];
  }
}

/**
 * Создать пустые колонки для секции
 */
export function createColumns(layout: SectionLayout): EmailColumn[] {
  const widths = getColumnWidths(layout);
  return widths.map((width, index) => ({
    id: `column-${Date.now()}-${index}`,
    width,
    blocks: [],
    settings: {
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      verticalAlign: 'top',
    }
  }));
}

/**
 * Дефолтные настройки секции
 */
export function getDefaultSectionSettings(): SectionSettings {
  return {
    backgroundColor: 'transparent',
    padding: { top: 20, right: 0, bottom: 20, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    fullWidth: false,
    borderRadius: 0,
    borderWidth: 0,
  };
}

/**
 * Дефолтные настройки блока
 */
export function getDefaultBlockSettings(): BlockSettings {
  return {
    padding: { top: 15, right: 20, bottom: 15, left: 20 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    backgroundColor: 'transparent',
    alignment: 'left',
    borderRadius: 0,
    borderWidth: 0,
  };
}

/**
 * Дефолтный контент для блока по типу
 */
export function getDefaultBlockContent(type: BlockType): any {
  switch (type) {
    case 'text':
      return {
        text: 'Введите ваш текст здесь...',
        fontSize: 16,
        color: '#333333',
        textType: 'p',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
      } as TextBlockContent;
      
    case 'heading':
      return {
        text: 'Заголовок',
        level: 'h2',
        fontSize: 32,
        color: '#000000',
        fontWeight: 'bold',
      } as HeadingBlockContent;
      
    case 'image':
      return {
        src: '',
        alt: '',
        width: '100%',
      } as ImageBlockContent;
      
    case 'button':
      return {
        text: 'Нажмите здесь',
        url: '',
        backgroundColor: '#6366f1',
        textColor: '#ffffff',
        borderRadius: 6,
        padding: '12px 24px',
      } as ButtonBlockContent;
      
    case 'divider':
      return {
        height: 1,
        color: '#e5e7eb',
        style: 'solid',
      } as DividerBlockContent;
      
    case 'spacer':
      return {
        height: 20,
      } as SpacerBlockContent;
      
    case 'social':
      return {
        networks: [],
        iconSize: 32,
        spacing: 10,
      } as SocialBlockContent;
      
    default:
      return {};
  }
}
