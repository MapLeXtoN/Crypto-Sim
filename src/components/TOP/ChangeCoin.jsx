// src/components/TOP/ChangeCoin.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SYMBOLS } from '../../constants'; // 請確認路徑是否正確

const ChangeCoin = ({ symbol, setSymbol, currentPrice }) => {
    return (
        <div className="flex items-center gap-4">
            {/* Logo (也可以拆出去，但放在這裡或 Header 都可以) */}
            <div className="flex items-center gap-2 text-yellow-500">
                <span className="text-xl font-bold">CryptoSim</span>
            </div>

            {/* 幣種下拉選單 */}
            <div className="relative group cursor-pointer bg-[#2b3139] px-3 py-1 rounded flex items-center gap-2">
                <span>{symbol}</span> <ChevronDown size={14} />
                <div className="absolute top-full left-0 mt-1 w-40 bg-[#2b3139] shadow-xl z-50 hidden group-hover:block border border-[#474d57]">
                    {SYMBOLS.map(s => (
                        <div key={s} onClick={() => setSymbol(s)} className="px-4 py-2 hover:bg-[#373d45]">
                            {s}
                        </div>
                    ))}
                </div>
            </div>

            {/* 當前價格 */}
            <span className="font-mono text-xl text-[#089981]">
                {typeof currentPrice === 'number' ? currentPrice.toFixed(2) : '0.00'}
            </span>
        </div>
    );
};

export default ChangeCoin;