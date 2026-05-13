import React from 'react';
import { GenerationResult } from '../../types';
import { ImageIcon, RefreshCcw, AlertCircle, Download, Eye, EyeOff } from '../Icons';

interface Props {
  results: GenerationResult[];
  isGenerating: boolean;
  onDownloadSingle: (item: GenerationResult) => void;
  onRetry: (id: string) => void;
  onToggleBgView: (id: string) => void;
}

const ResultCard: React.FC<{
  result: GenerationResult;
  isGenerating: boolean;
  onDownload: () => void;
  onRetry: () => void;
  onToggleBgView: () => void;
}> = ({ result, isGenerating, onDownload, onRetry, onToggleBgView }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
    {/* 圖片區 */}
    <div
      className={`relative aspect-square flex items-center justify-center ${
        result.isBackgroundRemoved
          ? 'bg-[url("https://checker-pattern.vercel.app/images/checker.png")] bg-repeat'
          : 'bg-gray-50'
      }`}
    >
      {result.status === 'completed' && result.imageUrl ? (
        <img src={result.imageUrl} alt={result.expressionLabel} className="w-full h-full object-contain" />
      ) : result.status === 'generating' ? (
        <div className="flex flex-col items-center text-indigo-500 animate-pulse">
          <RefreshCcw className="w-8 h-8 animate-spin mb-2" />
          <span className="text-xs font-medium">繪製中...</span>
        </div>
      ) : result.status === 'error' ? (
        <div className="flex flex-col items-center text-red-400 px-4 text-center">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-xs">{result.errorMsg ?? '生成失敗'}</span>
        </div>
      ) : result.status === 'cancelled' ? (
        <div className="flex flex-col items-center text-gray-400 px-4 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 mb-2 flex items-center justify-center text-gray-300 text-lg">✕</div>
          <span className="text-xs">已取消</span>
        </div>
      ) : (
        <div className="text-gray-300 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 mb-2" />
          <span className="text-xs">等待中</span>
        </div>
      )}

      {/* 切換原圖 / 去背圖 */}
      {result.status === 'completed' && result.originalImageUrl && (
        <button
          onClick={onToggleBgView}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
          title={result.isBackgroundRemoved ? '檢視原圖（綠幕）' : '檢視去背圖'}
        >
          {result.isBackgroundRemoved ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      )}
    </div>

    {/* 資訊與按鈕區 */}
    <div className="p-3 bg-white border-t border-gray-50 flex flex-col justify-between flex-1">
      <div className="mb-2">
        <span className="text-sm font-bold text-gray-800 block truncate" title={result.expressionLabel}>
          {result.expressionLabel}
        </span>
      </div>

      {result.status === 'completed' && result.imageUrl && (
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium transition-colors"
            title="下載 PNG"
          >
            <Download className="w-3 h-3" />
            <span>下載</span>
          </button>
          <button
            onClick={onRetry}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="重新生成此表情"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>重繪</span>
          </button>
        </div>
      )}

      {(result.status === 'error' || result.status === 'cancelled') && (
        <button
          onClick={onRetry}
          disabled={isGenerating}
          className="w-full flex items-center justify-center space-x-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCcw className="w-3 h-3" />
          <span>重新生成</span>
        </button>
      )}
    </div>
  </div>
);

const ResultsGrid: React.FC<Props> = ({
  results,
  isGenerating,
  onDownloadSingle,
  onRetry,
  onToggleBgView,
}) => {
  if (results.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <ImageIcon className="w-5 h-5 mr-2" />
        生成結果（320×320 + 文字）
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            isGenerating={isGenerating}
            onDownload={() => onDownloadSingle(result)}
            onRetry={() => onRetry(result.id)}
            onToggleBgView={() => onToggleBgView(result.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsGrid;
