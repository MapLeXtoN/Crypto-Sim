// --- src/components/chart/ChartUI.jsx ---

import React from 'react';
import { RefreshCw, AlertTriangle, ChevronDown, Star, MousePointer2, Minus, Box, List, Trash2, PlayCircle, Activity, Check, Settings } from 'lucide-react';
import { ALL_INTERVALS } from '../../constants';
import IndicatorSettingsModal from './IndicatorSettingsModal';

const ChartUI = ({
    timeframe, setTimeframe, loading, apiError, showTimeMenu, setShowTimeMenu,
    favorites, toggleFavorite, chartReadyState, setChartReadyState,
    setDrawTool, clearAllShapes, containerRef,
    
    // 指標 props
    indicators, indicatorSettings, showIndicatorMenu, setShowIndicatorMenu, handleToggleIndicator,
    // 設定視窗 props
    activeSettingModal, setActiveSettingModal, handleSaveSettings
}) => {
    return (
        <div className="flex-1 flex flex-col relative border-r border-[#2b3139]">
            {/* Toolbar */}
            <div className="flex justify-between items-center px-2 py-2 bg-[#131722] border-b border-[#2b3139]">
                
                {/* Left */}
                <div className="flex items-center gap-3 p-1 rounded bg-[#2b3139]">
                    <span className="text-xs text-gray-400 font-medium ml-1">時間</span>
                    <div className="w-[1px] h-4 bg-[#474d57]"></div>
                    <div className="relative flex items-center gap-2">
                        <button onClick={() => setShowTimeMenu(!showTimeMenu)} className={`p-1 hover:bg-[#474d57] rounded ${showTimeMenu ? 'text-yellow-500' : 'text-gray-400'}`}><ChevronDown size={16} /></button>
                        <span className="text-sm font-bold min-w-[30px] text-center text-[#eaecef]">{timeframe}</span>
                        {showTimeMenu && <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1">
                            {ALL_INTERVALS.map((item) => (
                                <div key={item.value} onClick={() => { setTimeframe(item.value); setShowTimeMenu(false); }} className="flex justify-between px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs text-[#eaecef]">
                                    <span>{item.label}</span>
                                    <div onClick={(e) => { e.stopPropagation(); toggleFavorite(item.value); }}><Star size={12} fill={favorites.includes(item.value) ? "#f0b90b" : "none"} className="text-gray-500 hover:text-[#f0b90b]" /></div>
                                </div>
                            ))}
                        </div>}
                    </div>
                    <div className="flex gap-1">{favorites.map(fav => (<button key={fav} onClick={() => setTimeframe(fav)} className={`px-2 py-1 text-xs rounded ${timeframe === fav ? 'text-[#f0b90b] bg-[#474d57]' : 'text-gray-400 hover:bg-[#474d57]'}`}>{fav}</button>))}</div>
                </div>
                
                {/* Middle */}
                <div className="flex gap-1 bg-[#2b3139] p-1 rounded items-center">
                    <button onClick={() => setDrawTool(null)} className="p-1.5 rounded text-gray-400 hover:bg-[#474d57] hover:text-white"><MousePointer2 size={16} /></button>
                    <button onClick={() => setDrawTool('rayLine')} className="p-1.5 rounded text-gray-400 hover:bg-[#474d57] hover:text-white"><Minus size={16} className="rotate-45" /></button>
                    <button onClick={() => setDrawTool('rect')} className="p-1.5 rounded text-gray-400 hover:bg-[#474d57] hover:text-white"><Box size={16} /></button>
                    <button onClick={() => setDrawTool('fibonacciLine')} className="p-1.5 rounded text-gray-400 hover:bg-[#474d57] hover:text-white"><List size={16} /></button>
                    <div className="w-[1px] h-4 bg-[#474d57] mx-1"></div>

                    {/* 指標下拉選單 */}
                    <div className="relative">
                        <button onClick={() => setShowIndicatorMenu(!showIndicatorMenu)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${showIndicatorMenu ? 'bg-[#474d57] text-[#f0b90b]' : 'text-gray-400 hover:bg-[#474d57] hover:text-white'}`}>
                            <Activity size={16} /><span>指標</span><ChevronDown size={12} />
                        </button>

                        {showIndicatorMenu && (
                            <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1">
                                {Object.keys(indicators).map((ind) => (
                                    <div key={ind} className="flex justify-between items-center px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs text-[#eaecef] group">
                                        <div className="flex-1 flex items-center gap-2" onClick={() => handleToggleIndicator(ind)}>
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center ${indicators[ind] ? 'bg-[#f0b90b] border-[#f0b90b]' : 'border-gray-500'}`}>
                                                {indicators[ind] && <Check size={10} className="text-black" />}
                                            </div>
                                            <span>{ind}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveSettingModal(ind); }} className="p-1 rounded hover:bg-[#474d57] text-gray-500 hover:text-white"><Settings size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 設定視窗 (Modal) */}
                        {activeSettingModal && (
                            <IndicatorSettingsModal 
                                indicator={activeSettingModal}
                                currentSettings={indicatorSettings[activeSettingModal]}
                                onClose={() => setActiveSettingModal(null)}
                                onSave={handleSaveSettings}
                            />
                        )}
                    </div>

                    <div className="w-[1px] h-4 bg-[#474d57] mx-1"></div>
                    <button onClick={clearAllShapes} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-[#474d57]"><Trash2 size={16} /></button>
                </div>

                {/* Right */}
                <div className="flex gap-4 text-xs">
                    {apiError && <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={12}/> 模擬模式</span>}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative bg-[#131722] overflow-hidden flex items-center justify-center">
                {loading && !chartReadyState && <div className="absolute top-2 right-2 text-xs text-gray-500 z-10 flex items-center"><RefreshCw size={10} className="animate-spin mr-1"/> Data Updating...</div>}
                {chartReadyState ? <div ref={containerRef} className="w-full h-full" /> : 
                    <div className="text-center">
                        <button onClick={() => setChartReadyState(true)} className="flex items-center gap-2 bg-[#f0b90b] text-black px-6 py-3 rounded-full font-bold text-lg hover:bg-[#d9a506] transition-transform hover:scale-105 shadow-lg">
                            <PlayCircle size={24} /> 啟動 K 線圖表
                        </button>
                    </div>
                }
            </div>
        </div>
    );
};

export default ChartUI;