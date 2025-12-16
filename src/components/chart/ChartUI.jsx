// src/components/chart/ChartUI.jsx

import React, { useState } from 'react';
import { 
    RefreshCw, AlertTriangle, ChevronDown, Star, 
    Trash2, PlayCircle, Activity, Check, Settings, 
    PenTool, MousePointer2, Magnet // 🔥 引入 Magnet Icon
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
    
    // 🔥 接收磁鐵狀態
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
                
                {/* Left: 時間週期 */}
                <div className="flex items-center gap-3 p-1 rounded bg-[#2b3139]">
                    <span className="text-xs text-gray-400 font-medium ml-1">時間</span>
                    <div className="w-[1px] h-4 bg-[#474d57]"></div>
                    <div className="relative flex items-center gap-2">
                        <button onClick={() => setShowTimeMenu(!showTimeMenu)} className={`p-1 hover:bg-[#474d57] rounded ${showTimeMenu ? 'text-yellow-500' : 'text-gray-400'}`}>
                            <ChevronDown size={16} />
                        </button>
                        <span className="text-sm font-bold min-w-[30px] text-center text-[#eaecef]">{timeframe}</span>
                        
                        {showTimeMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTimeMenu(false)} />
                                <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 py-1">
                                    {ALL_INTERVALS.map((item) => (
                                        <div key={item.value} onClick={() => { setTimeframe(item.value); setShowTimeMenu(false); }} className="flex justify-between px-3 py-2 hover:bg-[#2b3139] cursor-pointer text-xs text-[#eaecef]">
                                            <span>{item.label}</span>
                                            <div onClick={(e) => { e.stopPropagation(); toggleFavorite(item.value); }}>
                                                <Star size={12} fill={favorites.includes(item.value) ? "#f0b90b" : "none"} className="text-gray-500 hover:text-[#f0b90b]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Middle: 工具區 */}
                <div className="flex gap-2 items-center">
                    
                    {/* 1. 畫圖工具選單 */}
                    <div className="relative">
                        <div className="flex bg-[#2b3139] p-1 rounded items-center gap-1">
                            {/* 🔥 磁鐵按鈕 (新增) */}
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

                    {/* 2. 指標 */}
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

                    {/* 3. 垃圾桶 */}
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