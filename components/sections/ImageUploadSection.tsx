import React, { useRef } from 'react';
import { Upload, Trash2 } from '../Icons';

interface Props {
  preview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const ImageUploadSection: React.FC<Props> = ({ preview, onFileChange, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // 清空 value，確保同一張圖片可以重複選取
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  };

  return (
    <div className="md:col-span-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 flex items-center">
        <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm mr-2">
          1
        </span>
        上傳角色圖片
      </h2>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {!preview ? (
          <div
            onClick={handleClick}
            className="relative border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 transition-colors bg-gray-50 h-64 flex flex-col items-center justify-center text-gray-400 group cursor-pointer"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={onFileChange}
            />
            <Upload className="w-10 h-10 mb-2 group-hover:text-indigo-500 transition-colors" />
            <p className="text-sm font-medium">點擊或拖曳圖片至此</p>
            <p className="text-xs mt-1 text-gray-400">支援 PNG、JPG、WEBP（僅限一張）</p>
          </div>
        ) : (
          <div className="relative group">
            <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
              <img src={preview} alt="Source" className="w-full h-full object-contain" />
            </div>
            <div className="mt-3">
              <button
                onClick={onRemove}
                className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>刪除圖片</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadSection;
