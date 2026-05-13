import React from 'react';
import { Expression } from '../../types';
import { CheckCircle2, X, Plus, RefreshCcw, Wand2, Sparkles } from '../Icons';

interface Props {
  expressions: Expression[];
  customInput: string;
  styleInput: string;
  isGeneratingStyle: boolean;
  onToggle: (id: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (id: string) => void;
  onCustomInputChange: (v: string) => void;
  onStyleInputChange: (v: string) => void;
  onStyleGenerate: () => void;
}

const ExpressionSelector: React.FC<Props> = ({
  expressions,
  customInput,
  styleInput,
  isGeneratingStyle,
  onToggle,
  onAddCustom,
  onRemoveCustom,
  onCustomInputChange,
  onStyleInputChange,
  onStyleGenerate,
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 flex items-center mb-4">
        <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm mr-2">
          2
        </span>
        選擇或新增表情
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* 風格快速生成 */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
          <div className="flex items-center mb-3">
            <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
            <h3 className="text-sm font-bold text-indigo-800">快速生成主題清單</h3>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={styleInput}
              onChange={(e) => onStyleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onStyleGenerate()}
              placeholder="自訂主題風格（例如：職場厭世、熱戀情侶、學生日常）"
              className="flex-1 border border-indigo-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
            <button
              onClick={onStyleGenerate}
              disabled={!styleInput.trim() || isGeneratingStyle}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm font-medium whitespace-nowrap"
            >
              {isGeneratingStyle ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>風格生成</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-indigo-400 mt-2">
            * 將自動產生 16 個符合該主題的表情建議，並取代下方清單。
          </p>
        </div>

        {/* 表情勾選清單 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {expressions.map((exp) => (
            <div
              key={exp.id}
              onClick={() => onToggle(exp.id)}
              className={`relative flex items-center p-3 rounded-lg border cursor-pointer select-none transition-all ${
                exp.selected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mr-2 flex items-center justify-center flex-shrink-0 ${
                  exp.selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'
                }`}
              >
                {exp.selected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium truncate flex-1">{exp.label}</span>
              {exp.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustom(exp.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 新增自訂表情 */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddCustom()}
            placeholder="輸入自訂表情（例如：白眼、震驚）"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={onAddCustom}
            disabled={!customInput.trim()}
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>加入表情</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpressionSelector;
