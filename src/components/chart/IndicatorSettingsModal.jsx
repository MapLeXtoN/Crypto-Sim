// --- src/components/chart/IndicatorSettingsModal.jsx ---

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const IndicatorSettingsModal = ({ indicator, currentSettings, onClose, onSave }) => {
    const [localSettings, setLocalSettings] = useState(currentSettings);

    useEffect(() => {
        setLocalSettings(currentSettings);
    }, [currentSettings]);

    const handleChange = (key, value, index = null) => {
        setLocalSettings(prev => {
            if (index !== null && Array.isArray(prev[key])) {
                const newArr = [...prev[key]];
                newArr[index] = value;
                return { ...prev, [key]: newArr };
            }
            return { ...prev, [key]: value };
        });
    };

    const renderContent = () => {
        switch (indicator) {
            case 'EMA':
                return (
                    <div className="space-y-5">
                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1">輸入參數 (Inputs)</div>
                        {[0, 1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">EMA {i + 1} 長度</span>
                                <input 
                                    type="number" 
                                    value={localSettings.periods[i]} 
                                    onChange={(e) => handleChange('periods', parseInt(e.target.value), i)}
                                    className="bg-[#0b0e11] border border-[#474d57] text-white px-2 py-1 rounded w-20 text-sm text-right focus:border-[#f0b90b] outline-none"
                                />
                            </div>
                        ))}
                        
                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1 mt-4">樣式 (Style)</div>
                        {[0, 1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">EMA {i + 1} 顏色</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{localSettings.colors[i]}</span>
                                    <input 
                                        type="color" 
                                        value={localSettings.colors[i]} 
                                        onChange={(e) => handleChange('colors', e.target.value, i)}
                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'VOL':
                return (
                    <div className="space-y-5">
                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1">輸入參數</div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">成交量 MA 長度</span>
                            <input 
                                type="number" 
                                value={localSettings.maPeriod}
                                onChange={(e) => handleChange('maPeriod', parseInt(e.target.value))}
                                className="bg-[#0b0e11] border border-[#474d57] text-white px-2 py-1 rounded w-20 text-sm text-right focus:border-[#f0b90b] outline-none"
                            />
                        </div>

                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1 mt-4">可見性</div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">顯示 MA 線</span>
                            <input 
                                type="checkbox" 
                                checked={localSettings.showMA}
                                onChange={(e) => handleChange('showMA', e.target.checked)}
                                className="w-4 h-4 accent-[#f0b90b] cursor-pointer"
                            />
                        </div>
                    </div>
                );
            case 'MACD':
                return (
                    <div className="space-y-5">
                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1">輸入參數</div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { k: 'fast', l: '快線長度 (Fast)' },
                                { k: 'slow', l: '慢線長度 (Slow)' },
                                { k: 'signal', l: '訊號長度 (Signal)' }
                            ].map(item => (
                                <div key={item.k} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{item.l}</span>
                                    <input 
                                        type="number" 
                                        value={localSettings[item.k]}
                                        onChange={(e) => handleChange(item.k, parseInt(e.target.value))}
                                        className="bg-[#0b0e11] border border-[#474d57] text-white px-2 py-1 rounded w-20 text-sm text-right focus:border-[#f0b90b] outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'RSI':
                return (
                    <div className="space-y-5">
                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1">RSI 設定</div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">RSI 天數長度</span>
                            <input 
                                type="number" 
                                value={localSettings.period}
                                onChange={(e) => handleChange('period', parseInt(e.target.value))}
                                className="bg-[#0b0e11] border border-[#474d57] text-white px-2 py-1 rounded w-20 text-sm text-right focus:border-[#f0b90b] outline-none"
                            />
                        </div>

                        <div className="text-xs text-gray-400 font-bold border-b border-[#2b3139] pb-1 mt-4">樣式</div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">RSI 線條顏色</span>
                            <input 
                                type="color" 
                                value={localSettings.color || '#9c27b0'} 
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1e2329] border border-[#474d57] rounded-lg shadow-2xl z-[100] p-4 animate-in fade-in zoom-in-95 duration-100 font-sans">
            <div className="flex justify-between items-center mb-4 border-b border-[#2b3139] pb-2">
                <h3 className="font-bold text-[#f0b90b] text-base">{indicator} 設定</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18}/></button>
            </div>
            
            {renderContent()}

            <div className="mt-6 pt-4 border-t border-[#2b3139] flex justify-end gap-2">
                <button 
                    onClick={onClose}
                    className="px-3 py-1.5 rounded text-xs font-bold text-gray-400 hover:text-white hover:bg-[#2b3139] transition-colors border border-transparent hover:border-[#474d57]"
                >
                    取消
                </button>
                <button 
                    onClick={() => onSave(indicator, localSettings)}
                    className="flex items-center gap-2 bg-[#f0b90b] text-black px-4 py-1.5 rounded text-xs font-bold hover:bg-[#d9a506] transition-colors shadow-md"
                >
                    <Save size={14} /> 確認
                </button>
            </div>
        </div>
    );
};

export default IndicatorSettingsModal;