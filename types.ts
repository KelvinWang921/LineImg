export interface Expression {
  id: string;
  label: string;   // 顯示給使用者的文字（繁體中文）
  value: string;   // 送進 prompt 的文字（英文描述）
  isCustom: boolean;
  selected: boolean;
}

// 'cancelled' 是使用者手動停止時的狀態
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'error' | 'cancelled';

export interface GenerationResult {
  id: string;
  expressionId: string;
  expressionLabel: string;
  status: GenerationStatus;
  imageUrl?: string;          // 目前顯示的圖片（綠幕版 或 去背版）
  originalImageUrl?: string;  // 去背後保留原始綠幕版，方便切換預覽
  isBackgroundRemoved?: boolean;
  errorMsg?: string;
}

export interface PresetExpression {
  label: string;
  value: string;
}

export interface StickerMetadata {
  title_en: string;
  description_en: string;
  title_tc: string;
  description_tc: string;
}

export interface LineResizeOptions {
  main: boolean;
  tab: boolean;
}

export interface LineResizeResults {
  main?: string;
  tab?: string;
}
