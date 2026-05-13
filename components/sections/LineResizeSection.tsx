import React, { useRef } from 'react';
import { LineResizeOptions, LineResizeResults } from '../../types';
import { Upload, X, Package, RefreshCcw } from '../Icons';
import { downloadImage } from '../../utils/imageUtils';

interface Props {
  sourceFile: File | null;
  sourcePreview: string | null;
  options: LineResizeOptions;
  results: LineResizeResults;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onOptionsChange: (options: LineResizeOptions) => void;
  onResize: () => void;
}

const LineResizeSection: React.FC<Props> = ({
  sourceFile,
  sourcePreview,
  options,
  results,
  onFileChange,
  onRemoveFile,
  onOptionsChange,
  onResize,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  };

  return (
    <div className="border-t border-gray-200 pt-8 mt-12">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <Package className="w-5 h-5 mr-2" />
        Line 貼圖縮小區
      </h3>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:flex gap-8">
        {/* 上傳區 */}
        <div className="md:w-1/3 flex-shrink-0 mb-6 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">上傳要縮放的貼圖</label>
          <div
            className="relative border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 transition-colors bg-gray-50 h-64 flex flex-col items-center justify-center text-gray-400 group cursor-pointer overflow-hidden"
            onClick={!sourcePreview ? handleClick : undefined}
          >
            {!sourcePreview ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={onFileChange}
                />
                <Upload className="w-10 h-10 mb-2 group-hover:text-green-500 transition-colors" />
                <p className="text-sm font-medium">點擊或拖曳</p>
              </>
            ) : (
              <>
                <img src={sourcePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile();
                  }}
                  className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 控制與輸出 */}
        <div className="flex-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">選擇輸出尺寸</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  checked={options.main}
                  onChange={(e) => onOptionsChange({ ...options, main: e.target.checked })}
                />
                <div>
                  <span className="block font-medium text-gray-900">小舖縮圖（Main）</span>
                  <span className="text-sm text-gray-500">240×240 px（等比例縮放）</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  checked={options.tab}
                  onChange={(e) => onOptionsChange({ ...options, tab: e.target.checked })}
                />
                <div>
                  <span className="block font-medium text-gray-900">Icon 顯示縮圖（Tab）</span>
                  <span className="text-sm text-gray-500">96×74 px（直接縮放）</span>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={onResize}
            disabled={!sourceFile || (!options.main && !options.tab)}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>幫我縮放</span>
          </button>

          {/* 縮放結果 */}
          {(results.main || results.tab) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t border-gray-100 pt-4">
              {results.main && (
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
                  <img
                    src={results.main}
                    alt="Main"
                    className="w-16 h-16 object-contain bg-gray-50 border rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Main（240×240）</p>
                    <button
                      onClick={() => downloadImage(results.main!, 'line_main_240.png')}
                      className="text-xs text-green-600 hover:underline mt-1 font-medium"
                    >
                      下載圖片
                    </button>
                  </div>
                </div>
              )}
              {results.tab && (
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
                  <img
                    src={results.tab}
                    alt="Tab"
                    className="w-16 h-12 object-fill bg-gray-50 border rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Tab（96×74）</p>
                    <button
                      onClick={() => downloadImage(results.tab!, 'line_tab_96x74.png')}
                      className="text-xs text-green-600 hover:underline mt-1 font-medium"
                    >
                      下載圖片
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineResizeSection;
