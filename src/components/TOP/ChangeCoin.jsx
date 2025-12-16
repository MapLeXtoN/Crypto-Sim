// src/components/TOP/ChangeCoin.jsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SYMBOLS } from '../../constants'; 

const ChangeCoin = ({ symbol, setSymbol, currentPrice }) => {
    // 使用狀態來控制選單是否顯示
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 text-yellow-500">
                <span className="text-xl font-bold">CryptoSim</span>
            </div>

            {/* 幣種下拉選單容器 */}
            <div 
                className="relative cursor-pointer bg-[#2b3139] px-3 py-1 rounded flex items-center gap-2"
                // 滑鼠移入：開啟
                onMouseEnter={() => setIsHovered(true)}
                // 滑鼠移出：關閉 (因為有透明橋樑，移動到選單時不會觸發)
                onMouseLeave={() => setIsHovered(false)}
            >
                <span>{symbol}</span> 
                <ChevronDown size={14} className={`transition-transform ${isHovered ? 'rotate-180' : ''}`} />

                {/* 下拉選單內容 */}
                {isHovered && (
                    // 🔥 修正重點：
                    // 1. 移除 mt-1 (它會製造斷層)
                    // 2. 改用 pt-2 (Padding Top)，這是一個「透明填充區」，讓滑鼠移動路徑不中斷
                    <div className="absolute top-full left-0 pt-2 w-40 z-50 animate-fade-in">
                        
                        {/* 真正的選單外觀 (背景、邊框) 移到內層 div */}
                        <div className="bg-[#2b3139] shadow-xl border border-[#474d57] rounded-md overflow-hidden">
                            {SYMBOLS.map(s => (
                                <div 
                                    key={s} 
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        setSymbol(s);
                                        setIsHovered(false); // 點擊後關閉
                                    }} 
                                    className="px-4 py-2 hover:bg-[#373d45] transition-colors"
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 當前價格 */}
            <span className="font-mono text-xl text-[#089981]">
                {typeof currentPrice === 'number' ? currentPrice.toFixed(2) : '0.00'}
            </span>
        </div>
    );
};

export default ChangeCoin;