import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, TEXT_MODEL_NAME, METADATA_MODEL_NAME, SYSTEM_PROMPT, getGenerationPrompt } from "../constants";
import { PresetExpression, StickerMetadata } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * 生成表情圖片變體
   * @param imageBase64 來源圖片的 base64
   * @param expression 英文表情描述
   * @param signal 可選的 AbortSignal，用於取消請求
   */
  async generateExpressionVariation(
    imageBase64: string,
    expression: string,
    signal?: AbortSignal
  ): Promise<string> {
    // 在發送請求前先檢查是否已被取消
    if (signal?.aborted) {
      throw new DOMException('Generation was cancelled', 'AbortError');
    }

    const prompt = getGenerationPrompt(expression);

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    // 請求完成後再次檢查，避免處理已取消的結果
    if (signal?.aborted) {
      throw new DOMException('Generation was cancelled', 'AbortError');
    }

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from API');
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No content parts in API response');
    }

    const imagePart = parts.find((p) => p.inlineData?.data);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error('No image data found in API response');
  }

  /**
   * 根據主題風格生成 16 個表情建議清單
   * @param style 使用者輸入的主題描述
   */
  async generateStyleExpressions(style: string): Promise<PresetExpression[]> {
    const prompt = `
      You are a creative director for LINE stickers.
      The user wants a set of 16 sticker expressions based on the theme/style: "${style}".

      Generate 16 distinct, creative, and usable sticker expressions that fit this theme.
      They should cover a range of emotions (happy, sad, angry, funny, daily use).

      Output a JSON array where each object has:
      - label: A short Traditional Chinese title (2-6 characters) for the sticker (e.g. "不想上班", "吃土了").
      - value: A detailed English prompt describing the facial expression, specific hand gestures, and comic symbols typical for this emotion AND this specific style.

      Format the 'value' as: "[Emotion], [Action], [Symbols]".
      Example Value: "Exhausted, laying head on desk, soul leaving body"
    `;

    const response = await this.ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING },
            },
            required: ['label', 'value'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from style generation');

    const data = JSON.parse(text) as PresetExpression[];
    return data.slice(0, 16);
  }

  /**
   * 根據圖片與表情清單生成貼圖包標題與描述
   * @param imageBase64 角色圖片 base64
   * @param expressions 表情中文標籤陣列
   */
  async generateStickerMetadata(
    imageBase64: string,
    expressions: string[]
  ): Promise<StickerMetadata> {
    const prompt = `
      Analyze the provided character image and the following list of sticker expressions:
      ${expressions.join(', ')}

      Create a catchy and creative "Line Sticker Pack Title" and "Description".
      Provide both an English version and a Traditional Chinese version.

      - Title: Short, catchy, marketing-friendly (max 40 characters).
      - Description: Inviting, describing the character's personality and the sticker pack's utility (max 200 characters).

      Return JSON only.
    `;

    const response = await this.ai.models.generateContent({
      model: METADATA_MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_en:       { type: Type.STRING },
            description_en: { type: Type.STRING },
            title_tc:       { type: Type.STRING },
            description_tc: { type: Type.STRING },
          },
          required: ['title_en', 'description_en', 'title_tc', 'description_tc'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from metadata generation');

    return JSON.parse(text) as StickerMetadata;
  }
}

export const geminiService = new GeminiService();
