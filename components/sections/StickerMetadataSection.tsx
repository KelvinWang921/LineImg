import React from 'react';
import { StickerMetadata } from '../../types';
import { Sparkles, RefreshCcw } from '../Icons';

interface Props {
  metadata: StickerMetadata | null;
  isGenerating: boolean;
}

const StickerMetadataSection: React.FC<Props> = ({ metadata, isGenerating }) => (
  <div className="border-t border-gray-200 pt-8 mt-12 mb-12">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      <Sparkles className="w-5 h-5 mr-2" />
      貼圖主題與描述（自動生成）
    </h3>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
          <RefreshCcw className="w-8 h-8 animate-spin mb-3" />
          <span className="font-medium">正在為您的貼圖發想主題與文案...</span>
        </div>
      ) : metadata ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 繁體中文 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">繁體中文</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">貼圖標題</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 font-medium select-all">
                {metadata.title_tc}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">貼圖描述</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 text-sm leading-relaxed min-h-[80px] select-all">
                {metadata.description_tc}
              </div>
            </div>
          </div>

          {/* English */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">English</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Title</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 font-medium select-all">
                {metadata.title_en}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Description</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 text-sm leading-relaxed min-h-[80px] select-all">
                {metadata.description_en}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <p>點擊上方「開始生成」按鈕，系統將自動為您撰寫貼圖主題與描述。</p>
        </div>
      )}
    </div>
  </div>
);

export default StickerMetadataSection;
