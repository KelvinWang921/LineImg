import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { Package } from './components/Icons';
import { Expression, GenerationResult, LineResizeOptions, LineResizeResults, StickerMetadata } from './types';
import { PRESET_EXPRESSIONS } from './constants';
import {
  processImageForGenAI,
  downloadImage,
  resizeImage,
  addTextToImage,
  removeBackground,
  getBaseName,
} from './utils/imageUtils';
import { geminiService } from './services/geminiService';

// Sub-components
import ImageUploadSection from './components/sections/ImageUploadSection';
import ExpressionSelector from './components/sections/ExpressionSelector';
import ActionBar from './components/sections/ActionBar';
import ResultsGrid from './components/sections/ResultsGrid';
import LineResizeSection from './components/sections/LineResizeSection';
import StickerMetadataSection from './components/sections/StickerMetadataSection';

// ─── 環境變數檢查 ────────────────────────────────────────────────────────────
if (!process.env.API_KEY) {
  throw new Error(
    '[LineImg] 找不到 GEMINI_API_KEY。請在 .env.local 中設定 API_KEY=你的金鑰 後重新啟動。'
  );
}

const App: React.FC = () => {
  // ── State: 來源圖片 ────────────────────────────────────────────────────────
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);

  // ── State: 表情 ───────────────────────────────────────────────────────────
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [customInput, setCustomInput] = useState('');

  // ── State: 風格生成 ────────────────────────────────────────────────────────
  const [styleInput, setStyleInput] = useState('');
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);

  // ── State: 圖片生成 ────────────────────────────────────────────────────────
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── State: Metadata ────────────────────────────────────────────────────────
  const [stickerMetadata, setStickerMetadata] = useState<StickerMetadata | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

  // ── State: Line 縮圖 ───────────────────────────────────────────────────────
  const [lineSourceFile, setLineSourceFile] = useState<File | null>(null);
  const [lineSourcePreview, setLineSourcePreview] = useState<string | null>(null);
  const [lineOptions, setLineOptions] = useState<LineResizeOptions>({ main: false, tab: false });
  const [lineResults, setLineResults] = useState<LineResizeResults>({});

  // ── 初始化預設表情 ──────────────────────────────────────────────────────────
  useEffect(() => {
    setExpressions(
      PRESET_EXPRESSIONS.map((p, i) => ({
        id: `preset-${i}`,
        label: p.label,
        value: p.value,
        isCustom: false,
        selected: true, // 預設全選
      }))
    );
  }, []);

  // ── 釋放 Line 預覽 ObjectURL，避免 Memory Leak ─────────────────────────────
  useEffect(() => {
    return () => {
      if (lineSourcePreview) URL.revokeObjectURL(lineSourcePreview);
    };
  }, [lineSourcePreview]);

  // ── Handlers: 來源圖片 ──────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceImageFile(file);
    try {
      const { base64, previewUrl } = await processImageForGenAI(file);
      setSourceImageBase64(base64);
      setSourceImagePreview(previewUrl);
      setResults([]);
      setProcessedCount(0);
      setStickerMetadata(null);
    } catch (err) {
      console.error('Image processing error', err);
      alert('圖片處理失敗，請試著換一張圖片。');
    }
  };

  const handleRemoveImage = () => {
    setSourceImageFile(null);
    setSourceImagePreview(null);
    setSourceImageBase64(null);
    setResults([]);
    setProcessedCount(0);
    setStickerMetadata(null);
  };

  // ── Handlers: 表情 ─────────────────────────────────────────────────────────
  const toggleExpression = (id: string) => {
    setExpressions((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, selected: !exp.selected } : exp))
    );
  };

  const addCustomExpression = () => {
    if (!customInput.trim()) return;
    const newExp: Expression = {
      id: `custom-${Date.now()}`,
      label: customInput.trim(),
      value: customInput.trim(),
      isCustom: true,
      selected: true,
    };
    setExpressions((prev) => [...prev, newExp]);
    setCustomInput('');
  };

  const removeCustomExpression = (id: string) => {
    setExpressions((prev) => prev.filter((exp) => exp.id !== id));
  };

  // ── Handlers: 風格生成 ──────────────────────────────────────────────────────
  const handleStyleGeneration = async () => {
    if (!styleInput.trim()) return;
    setIsGeneratingStyle(true);
    try {
      const generated = await geminiService.generateStyleExpressions(styleInput.trim());
      setExpressions(
        generated.map((p, i) => ({
          id: `style-${Date.now()}-${i}`,
          label: p.label,
          value: p.value,
          isCustom: false,
          selected: true,
        }))
      );
      setStyleInput('');
    } catch (error) {
      console.error('Style generation failed', error);
      alert('風格清單生成失敗，請稍後再試。');
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  // ── Helper: 後處理管線（縮放 → 加文字）────────────────────────────────────
  const processGeneratedImage = async (rawImageUrl: string, label: string): Promise<string> => {
    const greenBgImage = await resizeImage(rawImageUrl, 320, 320, 'contain', '#00FF00');
    return addTextToImage(greenBgImage, label);
  };

  // ── Handlers: 生成圖片 ──────────────────────────────────────────────────────
  const startGeneration = async () => {
    if (!sourceImageBase64) return;
    const selectedExpressions = expressions.filter((e) => e.selected);
    if (selectedExpressions.length === 0) return;

    setIsGenerating(true);
    setIsGeneratingMetadata(true);
    setProcessedCount(0);
    setStickerMetadata(null);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // 1. 並行觸發 Metadata 生成
    geminiService
      .generateStickerMetadata(sourceImageBase64, selectedExpressions.map((e) => e.label))
      .then((data) => setStickerMetadata(data))
      .catch((err) => console.error('Metadata generation failed', err))
      .finally(() => setIsGeneratingMetadata(false));

    // 2. 初始化結果佔位
    const newResults: GenerationResult[] = selectedExpressions.map((exp) => ({
      id: `${Date.now()}-${exp.id}`,
      expressionId: exp.id,
      expressionLabel: exp.label,
      status: 'pending',
    }));
    setResults(newResults);

    // 3. 依序生成（sequential，避免 rate limit）
    for (let i = 0; i < newResults.length; i++) {
      if (signal.aborted) break;

      const resultItem = newResults[i];
      const expressionObj = expressions.find((e) => e.id === resultItem.expressionId);
      if (!expressionObj) continue;

      setResults((prev) =>
        prev.map((r) => (r.id === resultItem.id ? { ...r, status: 'generating' } : r))
      );

      try {
        const rawImageUrl = await geminiService.generateExpressionVariation(
          sourceImageBase64,
          expressionObj.value,
          signal
        );

        // 若在等待過程中被取消，不繼續後處理
        if (signal.aborted) break;

        const finalImageUrl = await processGeneratedImage(rawImageUrl, expressionObj.label);

        setResults((prev) =>
          prev.map((r) =>
            r.id === resultItem.id ? { ...r, status: 'completed', imageUrl: finalImageUrl } : r
          )
        );
      } catch (error) {
        const isCancelled =
          error instanceof DOMException && error.name === 'AbortError';

        setResults((prev) =>
          prev.map((r) =>
            r.id === resultItem.id
              ? {
                  ...r,
                  status: isCancelled ? 'cancelled' : 'error',
                  errorMsg: isCancelled ? undefined : '生成失敗，請重試',
                }
              : r
          )
        );

        if (isCancelled) break;
      } finally {
        setProcessedCount((prev) => prev + 1);
      }
    }

    // 將剩餘 pending 項目標記為 cancelled
    if (signal.aborted) {
      setResults((prev) =>
        prev.map((r) =>
          r.status === 'pending' ? { ...r, status: 'cancelled' } : r
        )
      );
    }

    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const retryItem = useCallback(
    async (resultId: string) => {
      if (!sourceImageBase64) return;
      const resultItem = results.find((r) => r.id === resultId);
      if (!resultItem) return;
      const expressionObj = expressions.find((e) => e.id === resultItem.expressionId);
      if (!expressionObj) return;

      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId ? { ...r, status: 'generating', errorMsg: undefined } : r
        )
      );

      try {
        const rawImageUrl = await geminiService.generateExpressionVariation(
          sourceImageBase64,
          expressionObj.value
        );
        const finalImageUrl = await processGeneratedImage(rawImageUrl, expressionObj.label);
        setResults((prev) =>
          prev.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  status: 'completed',
                  imageUrl: finalImageUrl,
                  originalImageUrl: undefined,
                  isBackgroundRemoved: false,
                }
              : r
          )
        );
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === resultId ? { ...r, status: 'error', errorMsg: '重試失敗' } : r
          )
        );
      }
    },
    [sourceImageBase64, results, expressions]
  );

  // ── Handlers: 去背 ─────────────────────────────────────────────────────────
  const handleRemoveBackground = async () => {
    const completedItems = results.filter((r) => r.status === 'completed' && r.imageUrl);
    if (completedItems.length === 0) return;

    setIsProcessingBackground(true);

    for (const item of completedItems) {
      // 已去背的跳過
      if (item.isBackgroundRemoved && item.originalImageUrl) continue;

      const sourceUrl = item.originalImageUrl ?? item.imageUrl;
      if (!sourceUrl) continue;

      try {
        const noBgUrl = await removeBackground(sourceUrl);
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  imageUrl: noBgUrl,
                  originalImageUrl: sourceUrl,
                  isBackgroundRemoved: true,
                }
              : r
          )
        );
      } catch (err) {
        console.error(`Failed to remove BG for ${item.expressionLabel}`, err);
      }
    }

    setIsProcessingBackground(false);
  };

  /**
   * 切換顯示「去背圖」或「原始綠幕圖」。
   * 改用 isBackgroundRemoved flag 控制顯示，永遠保留兩個 URL 避免 swap 造成 bug。
   */
  const toggleBgView = (resultId: string) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== resultId || !r.originalImageUrl) return r;
        // 互換 imageUrl 與 originalImageUrl（綠幕版 ↔ 去背版）
        return {
          ...r,
          imageUrl: r.originalImageUrl,
          originalImageUrl: r.imageUrl,
          isBackgroundRemoved: !r.isBackgroundRemoved,
        };
      })
    );
  };

  // ── Handlers: 下載 ─────────────────────────────────────────────────────────
  const buildFilename = (expressionLabel: string, isBackgroundRemoved?: boolean): string => {
    const base = sourceImageFile ? getBaseName(sourceImageFile.name) : 'sticker';
    const sanitized = base.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
    const suffix = isBackgroundRemoved ? '_noBG' : '';
    return `${sanitized}__${expressionLabel}${suffix}.png`;
  };

  const handleDownloadSingle = (item: GenerationResult) => {
    if (!item.imageUrl) return;
    try {
      downloadImage(item.imageUrl, buildFilename(item.expressionLabel, item.isBackgroundRemoved));
    } catch (e) {
      console.error('Download failed', e);
      alert('下載失敗，請重試');
    }
  };

  const handleDownloadZip = async () => {
    const completed = results.filter((r) => r.status === 'completed' && r.imageUrl);
    if (completed.length === 0) return;

    const zip = new JSZip();
    // 計數器，從 1 開始，有重複才加後綴
    const nameCounts: Record<string, number> = {};

    await Promise.all(
      completed.map(async (item) => {
        if (!item.imageUrl) return;

        const base64Data = item.imageUrl.split(',')[1];
        const baseName = buildFilename(item.expressionLabel, item.isBackgroundRemoved).replace(
          '.png',
          ''
        );

        // 同名計數：第一次 → 原名，第二次起 → 原名_2, _3, ...
        const count = nameCounts[baseName] ?? 0;
        nameCounts[baseName] = count + 1;
        const uniqueName = count === 0 ? `${baseName}.png` : `${baseName}_${count + 1}.png`;

        zip.file(uniqueName, base64Data, { base64: true });
      })
    );

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stickers.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Zip generation failed', e);
      alert('打包下載失敗，請重試');
    }
  };

  // ── Handlers: Line 縮圖 ────────────────────────────────────────────────────
  const handleLineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 釋放舊的 ObjectURL
    if (lineSourcePreview) URL.revokeObjectURL(lineSourcePreview);

    setLineSourceFile(file);
    setLineSourcePreview(URL.createObjectURL(file));
    setLineResults({});
  };

  const handleLineRemoveFile = () => {
    if (lineSourcePreview) URL.revokeObjectURL(lineSourcePreview);
    setLineSourceFile(null);
    setLineSourcePreview(null);
    setLineResults({});
  };

  const handleLineResize = async () => {
    if (!lineSourceFile) return;
    try {
      const newResults: LineResizeResults = {};
      if (lineOptions.main) {
        newResults.main = await resizeImage(lineSourceFile, 240, 240, 'contain');
      }
      if (lineOptions.tab) {
        newResults.tab = await resizeImage(lineSourceFile, 96, 74, 'fill');
      }
      setLineResults(newResults);
    } catch (e) {
      console.error('Line resize failed', e);
      alert('圖片縮放失敗');
    }
  };

  // ── 計算衍生狀態 ───────────────────────────────────────────────────────────
  const activeExpressionCount = expressions.filter((e) => e.selected).length;
  const canGenerate =
    !!sourceImageBase64 && activeExpressionCount > 0 && !isGenerating && !isProcessingBackground;
  const hasCompletedResults = results.some((r) => r.status === 'completed');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Package className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">表情貼圖生成器</h1>
          </div>
          {hasCompletedResults && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center space-x-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>全部下載（ZIP）</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 上方：上傳 + 表情選擇 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <ImageUploadSection
            preview={sourceImagePreview}
            onFileChange={handleFileChange}
            onRemove={handleRemoveImage}
          />

          <div className="md:col-span-8 space-y-6">
            <ExpressionSelector
              expressions={expressions}
              customInput={customInput}
              styleInput={styleInput}
              isGeneratingStyle={isGeneratingStyle}
              onToggle={toggleExpression}
              onAddCustom={addCustomExpression}
              onRemoveCustom={removeCustomExpression}
              onCustomInputChange={setCustomInput}
              onStyleInputChange={setStyleInput}
              onStyleGenerate={handleStyleGeneration}
            />

            <ActionBar
              isGenerating={isGenerating}
              isProcessingBackground={isProcessingBackground}
              canGenerate={canGenerate}
              hasCompletedResults={hasCompletedResults}
              activeExpressionCount={activeExpressionCount}
              processedCount={processedCount}
              totalCount={results.length}
              onStart={startGeneration}
              onStop={stopGeneration}
              onRemoveBackground={handleRemoveBackground}
            />
          </div>
        </div>

        {/* 生成結果 */}
        <ResultsGrid
          results={results}
          isGenerating={isGenerating}
          onDownloadSingle={handleDownloadSingle}
          onRetry={retryItem}
          onToggleBgView={toggleBgView}
        />

        {/* Line 縮圖工具 */}
        <LineResizeSection
          sourceFile={lineSourceFile}
          sourcePreview={lineSourcePreview}
          options={lineOptions}
          results={lineResults}
          onFileChange={handleLineFileChange}
          onRemoveFile={handleLineRemoveFile}
          onOptionsChange={setLineOptions}
          onResize={handleLineResize}
        />

        {/* 貼圖 Metadata */}
        <StickerMetadataSection
          metadata={stickerMetadata}
          isGenerating={isGeneratingMetadata}
        />
      </main>
    </div>
  );
};

export default App;
