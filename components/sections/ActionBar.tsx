import React from 'react';
import { Play, Square, RefreshCcw, Wand2 } from '../Icons';

interface Props {
  isGenerating: boolean;
  isProcessingBackground: boolean;
  canGenerate: boolean;
  hasCompletedResults: boolean;
  activeExpressionCount: number;
  processedCount: number;
  totalCount: number;
  onStart: () => void;
  onStop: () => void;
  onRemoveBackground: () => void;
}

const ActionBar: React.FC<Props> = ({
  isGenerating,
  isProcessingBackground,
  canGenerate,
  hasCompletedResults,
  activeExpressionCount,
  processedCount,
  totalCount,
  onStart,
  onStop,
  onRemoveBackground,
}) => {
  const isLocked = isGenerating || isProcessingBackground;

  return (
    <div className="sticky bottom-6 z-10">
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 狀態文字 */}
        <div className="text-sm text-gray-600">
          {isGenerating ? (
            <span className="flex items-center text-indigo-600 font-medium">
              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              生成中... (已完成 {processedCount} / {totalCount})
            </span>
          ) : isProcessingBackground ? (
            <span className="flex items-center text-purple-600 font-medium">
              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              去背處理中...
            </span>
          ) : (
            <span>已選擇 {activeExpressionCount} 個表情</span>
          )}
        </div>

        {/* 按鈕群 */}
        <div className="flex space-x-3 w-full sm:w-auto">
          {isGenerating ? (
            <button
              onClick={onStop}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-lg font-bold transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>停止生成</span>
            </button>
          ) : (
            <>
              <button
                onClick={onStart}
                disabled={!canGenerate}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3 rounded-lg font-bold transition-all shadow-md ${
                  canGenerate
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>開始生成</span>
              </button>

              <button
                onClick={onRemoveBackground}
                disabled={!hasCompletedResults || isLocked}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
                  hasCompletedResults && !isLocked
                    ? 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                    : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>一鍵去背</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
