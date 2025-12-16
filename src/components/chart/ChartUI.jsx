// src/components/chart/ChartUI.jsx

import React, { useState } from 'react';
import { 
    RefreshCw, AlertTriangle, ChevronDown, Star, 
    Trash2, PlayCircle, Activity, Check, Settings, 
    PenTool, MousePointer2, Magnet 
} from 'lucide-react';
import { ALL_INTERVALS } from '../../constants'; 
import IndicatorSettingsModal from './IndicatorSettingsModal';

const DRAWING_TOOLS_LIST = [
    { category: '基礎', items: [
        { label: '線段 (Segment)', value: 'segment' },
        { label: '直線 (Line)', value: 'straightLine' },
        { label: '水平線 (Horizontal)', value: 'horizontalStraightLine' },
        { label: '垂直線 (Vertical)', value: 'verticalStraightLine' },
    ]},
    { category: '幾何圖形', items: [
        { label: '矩形 (Rect)', value: 'rect' },
        { label: '圓形 (Circle)', value: 'circle' },
        { label: '三角形 (Triangle)', value: 'triangle' },
    ]},
    { category: '金融工具', items: [
        { label: '斐波那契回調', value: 'fibonacciLine' },
        { label: '價格線', value: 'priceLine' },
        { label: '文字標註', value: 'simpleAnnotation' },
    ]}
];

const ChartUI = ({
    timeframe, setTimeframe, loading, apiError, showTimeMenu, setShowTimeMenu,
    favorites, toggleFavorite, chartReadyState, setChartReadyState,
    
    activeToolName, 
    onSelectTool, 
    onResetCursor,
    clearAllShapes, 
    containerRef,
    
    magnetMode,
    setMagnetMode,

    indicators, indicatorSettings, showIndicatorMenu, setShowIndicatorMenu, handleToggleIndicator,
    activeSettingModal, setActiveSettingModal, handleSaveSettings
}) => {
    const [showDrawMenu, setShowDrawMenu] = useState(false);

    return (
        <div className="flex-1 flex flex-col relative border-r border-[#2b3139]">
            {/* Toolbar 工具列 */}
            <div className="flex justify-between items-center px-2 py-2 bg-[#131722] border-b border-[#2b3139]">
                
                {/* Left: 時間週期 (修改重點區) */}
                <div className="flex items-center gap-2 p-1 rounded bg-[#2b3139]">
                    <span className="text-xs text-gray-400 font-medium ml-1">時間</span>
                    <div className="w-[1px] h-4 bg-[#474d57] mx-1"></div>
                    
                    {/* 1. 下拉選單按鈕 (保留，用於選擇非最愛的週期) */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowTimeMenu(!showTimeMenu)} 
                            className={`p-1.5 hover:bg-[#474d57] rounded flex items-center gap-1 ${showTimeMenu ? 'text-[#f0b90b]' : 'text-gray-400'}`}
                            title="所有週期"
                        >
                            <ChevronDown size={14} />
                        </button>
                        
                        {/* 下拉選單內容 */}
                        {showTimeMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTimeMenu(false)} />
                                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1">
                                    {ALL_INTERVALS.map((item) => (
                                        <div 
                                            key={item.value} 
                                            onClick={() => { setTimeframe(item.value); setShowTimeMenu(false); }} 
                                            className={`flex justify-between px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs ${timeframe === item.value ? 'text-[#f0b90b] font-bold' : 'text-[#eaecef]'}`}
                                        >
                                            <span>{item.label}</span>
                                            <div onClick={(e) => { e.stopPropagation(); toggleFavorite(item.value); }}>
                                                <Star size={12} fill={favorites.includes(item.value) ? "#f0b90b" : "none"} className={favorites.includes(item.value) ? "text-[#f0b90b]" : "text-gray-500 hover:text-[#f0b90b]"} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 🔥 2. 最愛週期快捷鍵 (新增部分) */}
                    {favorites && favorites.length > 0 && (
                        <div className="flex items-center gap-1">
                            {/* 根據 constants 的順序排序 favorites，確保 15m 在 1h 前面 (選擇性優化，這裡直接 map 也可以) */}
                            {favorites.map(fav => (
                                <button
                                    key={fav}
                                    onClick={() => setTimeframe(fav)}
                                    className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                        timeframe === fav 
                                            ? 'text-[#f0b90b] bg-[#474d57]' // 當前選中
                                            : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#363c45]' // 未選中
                                    }`}
                                >
                                    {fav}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 如果當前選的週期不在最愛列表裡，額外顯示出來，讓使用者知道現在是哪個週期 */}
                    {!favorites.includes(timeframe) && (
                        <>
                            <div className="w-[1px] h-3 bg-[#474d57] mx-1"></div>
                            <span className="text-xs font-bold text-[#f0b90b] px-2">{timeframe}</span>
                        </>
                    )}
                </div>
                
                {/* Middle: 工具區 (畫圖/指標/磁鐵) */}
                <div className="flex gap-2 items-center">
                    
                    {/* 畫圖工具 */}
                    <div className="relative">
                        <div className="flex bg-[#2b3139] p-1 rounded items-center gap-1">
                            {/* 磁鐵 */}
                            <button 
                                onClick={() => setMagnetMode(!magnetMode)}
                                title={magnetMode ? "關閉磁鐵" : "開啟磁鐵"}
                                className={`p-1.5 rounded transition-colors ${magnetMode ? 'text-[#f0b90b] bg-[#474d57]' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                            >
                                <Magnet size={16} />
                            </button>

                            <div className="w-[1px] h-4 bg-[#474d57] mx-1"></div>

                            {activeToolName && (
                                <button 
                                    onClick={onResetCursor}
                                    title="取消畫圖 (切換回普通游標)"
                                    className="p-1.5 rounded text-[#f0b90b] bg-[#474d57] hover:bg-gray-600"
                                >
                                    <MousePointer2 size={16} />
                                </button>
                            )}

                            <button 
                                onClick={() => setShowDrawMenu(!showDrawMenu)} 
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${showDrawMenu || activeToolName ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <PenTool size={16} />
                                <span>{activeToolName || "畫圖工具"}</span>
                                <ChevronDown size={12} />
                            </button>
                        </div>

                        {showDrawMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDrawMenu(false)} />
                                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1 max-h-[400px] overflow-y-auto">
                                    <div 
                                        onClick={() => { onResetCursor(); setShowDrawMenu(false); }}
                                        className="px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs text-[#eaecef] border-b border-[#2b3139] flex items-center gap-2"
                                    >
                                        <MousePointer2 size={14} /> <span>普通游標 (移動圖表)</span>
                                    </div>

                                    {DRAWING_TOOLS_LIST.map((group) => (
                                        <div key={group.category}>
                                            <div className="px-3 py-1 text-[10px] text-gray-500 font-bold bg-[#131722] mt-1">
                                                {group.category}
                                            </div>
                                            {group.items.map((tool) => (
                                                <div 
                                                    key={tool.value}
                                                    onClick={() => { onSelectTool(tool.value, tool.label); setShowDrawMenu(false); }}
                                                    className={`px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs flex justify-between items-center ${activeToolName === tool.label ? 'text-[#f0b90b]' : 'text-[#eaecef]'}`}
                                                >
                                                    <span>{tool.label}</span>
                                                    {activeToolName === tool.label && <Check size={12} />}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-[1px] h-4 bg-[#474d57]"></div>

                    {/* 指標 */}
                    <div className="relative">
                        <button title="技術指標" onClick={() => setShowIndicatorMenu(!showIndicatorMenu)} className={`flex items-center gap-1 px-2 py-1.5 rounded bg-[#2b3139] text-xs font-bold transition-colors ${showIndicatorMenu ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'}`}>
                            <Activity size={16} /><span>指標</span><ChevronDown size={12} />
                        </button>

                        {showIndicatorMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowIndicatorMenu(false)} />
                                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1">
                                    {Object.keys(indicators).map((ind) => (
                                        <div key={ind} className="flex justify-between items-center px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs text-[#eaecef] group">
                                            <div className="flex-1 flex items-center gap-2" onClick={() => handleToggleIndicator(ind)}>
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${indicators[ind] ? 'bg-[#f0b90b] border-[#f0b90b]' : 'border-gray-500'}`}>
                                                    {indicators[ind] && <Check size={10} className="text-black" />}
                                                </div>
                                                <span>{ind}</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveSettingModal(ind); }} className="p-1 rounded hover:bg-[#474d57] text-gray-500 hover:text-white">
                                                <Settings size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        
                        {activeSettingModal && (
                            <IndicatorSettingsModal 
                                indicator={activeSettingModal}
                                currentSettings={indicatorSettings[activeSettingModal]}
                                onClose={() => setActiveSettingModal(null)}
                                onSave={handleSaveSettings}
                            />
                        )}
                    </div>

                    <div className="w-[1px] h-4 bg-[#474d57]"></div>

                    {/* 垃圾桶 */}
                    <button 
                        title="清除所有畫圖" 
                        onClick={clearAllShapes} 
                        className="p-1.5 rounded bg-[#2b3139] text-gray-400 hover:text-red-500 hover:bg-[#474d57]"
                    >
                        <Trash2 size={16} />
                    </button>

                </div>

                {/* Right: 狀態提示 */}
                <div className="flex gap-4 text-xs">
                    {apiError && <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={12}/> 模擬模式</span>}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative bg-[#131722] overflow-hidden flex items-center justify-center">
                {loading && !chartReadyState && (
                    <div className="absolute top-2 right-2 text-xs text-gray-500 z-10 flex items-center">
                        <RefreshCw size={10} className="animate-spin mr-1"/> Updating...
                    </div>
                )}
                {chartReadyState ? (
                    <div ref={containerRef} className="w-full h-full" />
                ) : (
                    <div className="text-center">
                        <button 
                            onClick={() => setChartReadyState(true)} 
                            className="flex items-center gap-2 bg-[#f0b90b] text-black px-6 py-3 rounded-full font-bold text-lg hover:bg-[#d9a506] transition-transform hover:scale-105 shadow-lg"
                        >
                            <PlayCircle size={24} /> 啟動 K 線圖表
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartUI;