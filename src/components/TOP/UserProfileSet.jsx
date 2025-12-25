// src/components/TOP/UserProfileSet.jsx
import React, { useState, useMemo, useEffect } from "react";
import { User, DollarSign, Download, TrendingUp } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { formatMoney } from "../../utils"; 
import { INITIAL_BALANCE } from "../../constants"; 

const UserProfileSet = ({ user, onClose, resetAccount, setUser, history = [], equity, balance, currentSymbol, feeSettings, setFeeSettings, selectedExchange, setSelectedExchange, heldCoins }) => {
    
    const [activeTab, setActiveTab] = useState("profile");
    const [transSubTab, setTransSubTab] = useState("futures"); 
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [photoURL, setPhotoURL] = useState(user.photoURL || "");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    const [tempFees, setTempFees] = useState(feeSettings);
    
    const [marketPrices, setMarketPrices] = useState({});

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await fetch('https://api.binance.com/api/v3/ticker/price');
                const data = await res.json();
                const priceMap = {};
                data.forEach(item => {
                    priceMap[item.symbol] = parseFloat(item.price);
                });
                setMarketPrices(priceMap);
            } catch (error) {
                console.error("無法獲取價格:", error);
            }
        };
        fetchPrices();
    }, []);

    const filteredHistory = useMemo(() => {
        if (!history || history.length === 0) return [];
        return history.filter(item => {
            const itemMode = item.mode || "";
            const itemGridType = item.gridType || "";
            if (transSubTab === "futures") return itemMode === "futures";
            if (transSubTab === "spot") return itemMode === "spot";
            if (transSubTab === "grid_futures") return itemMode === "grid_futures" || (itemMode === "grid" && itemGridType === "futures");
            if (transSubTab === "grid_spot") return itemMode === "grid_spot" || (itemMode === "grid" && itemGridType === "spot");
            return false;
        });
    }, [history, transSubTab]);

    const handleExport = () => {
        const labels = { futures: "合約", spot: "現貨", grid_futures: "合約網格", grid_spot: "現貨網格" };
        const currentLabel = labels[transSubTab];
        
        // 檢查：如果是現貨，即使沒有歷史紀錄，只要有持倉也允許匯出
        const hasHistory = filteredHistory.length > 0;
        const hasHoldings = heldCoins && heldCoins.length > 0;
        
        if (!hasHistory && !(transSubTab === 'spot' && hasHoldings)) {
            alert("目前無資料可供匯出");
            return;
        }

        alert("正在執行量化分析並匯出 [" + currentLabel + "] 報表...");

        // --- Part 1: 歷史交易紀錄 (共用) ---
        const headers = [
            "平倉時間", "開單時間", "持單時間", "交易幣種", "方向", "成交均價", "成交數量", 
            "成交金額 (USDT)", "手續費 (USDT)", "已實現盈虧 (USDT)", "單筆投報率 (%)"
        ];
        
        let totalVolume = 0;
        let totalFee = 0;
        let totalPnL = 0;

        const rows = filteredHistory.map(item => {
            const sideText = transSubTab.includes("futures") 
                ? (item.side === "long" ? "做多 (LONG)" : "做空 (SHORT)") 
                : (item.side === "long" || item.side === "buy" ? "買入 (BUY)" : "賣出 (SELL)");

            const price = parseFloat(item.entryPrice || item.price || 0);
            const size = parseFloat(item.size || 0);
            const amount = parseFloat(item.amount || (price * size));
            const fee = parseFloat(item.entryFee || (amount * (item.feeRate || 0) / 100) || 0);
            const pnl = parseFloat(item.pnl || 0);
            const roi = amount > 0 ? (pnl / amount) * 100 : 0;

            const openT = new Date(item.time);
            const closeT = new Date(item.exitTime || item.time);
            let durationStr = "-";
            if (!isNaN(openT) && !isNaN(closeT)) {
                const diffMs = closeT - openT;
                const hrs = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                durationStr = `${hrs}h ${mins}m`;
            }

            totalVolume += amount;
            totalFee += fee;
            totalPnL += pnl;

            return [
                item.exitTime || item.time,
                item.time,
                durationStr,
                item.symbol,
                sideText,
                price.toFixed(2),
                size.toFixed(4),
                amount.toFixed(2),
                fee.toFixed(4),
                pnl.toFixed(2),
                roi.toFixed(2) + "%"
            ];
        });

        const summaryRow = ["歷史總結 (HISTORY SUMMARY)", "-", "-", "-", "-", "-", "-", totalVolume.toFixed(2), totalFee.toFixed(4), totalPnL.toFixed(2), "-"];
        const portfolioRoi = (totalPnL / INITIAL_BALANCE) * 100;
        const portfolioRow = ["歷史績效分析", "-", "-", "-", "-", "-", "-", "初始本金: " + INITIAL_BALANCE, "總淨利: " + totalPnL.toFixed(2), "總報酬率: " + portfolioRoi.toFixed(2) + "%", "-"];

        // 🔥 [修正] Part 2: 當前持倉快照 (僅限 "現貨" 報表顯示)
        let csvContent = "";
        
        if (transSubTab === 'spot') {
            const holdingHeaders = ["當前持倉 (CURRENT HOLDINGS)", "數量", "平均成本", "當前市價", "總成本 (USDT)", "當前市值 (USDT)", "未實現盈虧 (USDT)", "報酬率 (%)"];
            let holdingRows = [];
            
            if (hasHoldings) {
                holdingRows = heldCoins.map(coin => {
                    const totalCost = coin.quantity * coin.avgPrice;
                    const livePrice = marketPrices[`${coin.symbol}USDT`] || 0;
                    
                    let marketValue = 0;
                    let unrealizedPnL = 0;
                    let roi = 0;

                    if (livePrice > 0) {
                        marketValue = coin.quantity * livePrice;
                        unrealizedPnL = marketValue - totalCost;
                        roi = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
                    }

                    return [
                        coin.symbol,
                        coin.quantity.toFixed(4),
                        coin.avgPrice.toFixed(2),
                        livePrice > 0 ? livePrice.toFixed(2) : "載入中...",
                        totalCost.toFixed(2),
                        livePrice > 0 ? marketValue.toFixed(2) : "-",
                        livePrice > 0 ? unrealizedPnL.toFixed(2) : "-",
                        livePrice > 0 ? roi.toFixed(2) + "%" : "-"
                    ];
                });
            } else {
                holdingRows = [["無持有資產", "-", "-", "-", "-", "-", "-", "-"]];
            }

            // 現貨報表：歷史 + 持倉
            csvContent = "\uFEFF" + [headers, ...rows, [], summaryRow, portfolioRow, [], [], holdingHeaders, ...holdingRows].map(e => e.join(",")).join("\n");
        
        } else {
            // 合約與網格報表：只顯示歷史
            csvContent = "\uFEFF" + [headers, ...rows, [], summaryRow, portfolioRow].map(e => e.join(",")).join("\n");
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "量化分析報表_" + currentLabel + ".csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpdateProfile = async () => {
        if (!displayName.trim()) return;
        try {
            await updateProfile(user, { displayName, photoURL });
            setUser({ ...user, displayName, photoURL }); 
            setStatusMsg({ type: "success", text: "個人資料已更新" });
        } catch (error) { setStatusMsg({ type: "error", text: "更新失敗" }); }
    };

    const handleExchangeChange = (e) => {
        const exchange = e.target.value;
        setSelectedExchange(exchange); 
        let newRates = { ...tempFees };
        switch(exchange) {
            case "Binance": newRates = { ...newRates, spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05 }; break;
            case "MEXC": newRates = { ...newRates, spotMaker: 0.0, spotTaker: 0.02, futuresMaker: 0.02, futuresTaker: 0.06 }; break;
            case "OKX": newRates = { ...newRates, spotMaker: 0.08, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05 }; break;
            case "Pionex": newRates = { ...newRates, spotMaker: 0.05, spotTaker: 0.05, futuresMaker: 0.02, futuresTaker: 0.05 }; break;
            case "Bybit": newRates = { ...newRates, spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.055 }; break;
            case "Bitget": newRates = { ...newRates, spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.06 }; break;
            default: break;
        }
        setTempFees(newRates);
    };

    const handleSaveFees = () => {
        setFeeSettings(tempFees);
        setStatusMsg({ type: "success", text: "費率設定已更新" });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1e2329] w-full max-w-4xl h-[600px] rounded-lg border border-[#2b3139] overflow-hidden flex">
                <div className="w-1/4 bg-[#161a1e] border-r border-[#2b3139] flex flex-col">
                    <div className="p-6 border-b border-[#2b3139] font-bold text-[#f0b90b]">設定中心</div>
                    <nav className="flex-1 p-2 space-y-1">
                        <button onClick={() => setActiveTab("profile")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "profile" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><User size={18} /> 基本資料</button>
                        <button onClick={() => setActiveTab("fees")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "fees" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><DollarSign size={18} /> 手續費設定</button>
                        <button onClick={() => setActiveTab("transactions")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "transactions" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><TrendingUp size={18} /> 交易明細</button>
                    </nav>
                    <button onClick={onClose} className="m-4 py-2 bg-[#2b3139] text-xs rounded">關閉設定</button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-[#1e2329]">
                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
                        {statusMsg.text && <div className={`p-3 rounded text-sm text-center ${statusMsg.type === "success" ? "bg-[#089981]/20 text-[#089981]" : "bg-[#F23645]/20 text-[#F23645]"}`}>{statusMsg.text}</div>}
                        
                        {activeTab === "profile" ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">資產總額 (Equity)</div><div className="text-xl font-bold">{formatMoney(equity)}</div></div>
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">可用資金 (Balance)</div><div className="text-xl font-bold">{formatMoney(balance)}</div></div>
                                </div>

                                <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]">
                                    <div className="text-xs text-[#848e9c] mb-3 font-bold">持有的幣種詳細資產</div>
                                    {heldCoins && heldCoins.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-5 text-[10px] text-[#848e9c] uppercase border-b border-[#474d57] pb-1">
                                                <span>幣種</span>
                                                <span className="text-center">持倉數量</span>
                                                <span className="text-center">平均成本</span>
                                                <span className="text-center">總花費 (USDT)</span>
                                                <span className="text-right">預估損益</span>
                                            </div>
                                            
                                            {heldCoins.map((coin, index) => {
                                                const totalCost = coin.quantity * coin.avgPrice;
                                                const livePrice = marketPrices[`${coin.symbol}USDT`] || 0;
                                                const profit = livePrice > 0 ? (livePrice - coin.avgPrice) * coin.quantity : 0;
                                                const isProfit = profit >= 0;

                                                return (
                                                    <div key={index} className="grid grid-cols-5 text-sm font-bold items-center">
                                                        <span className="text-[#f0b90b]">{coin.symbol}</span>
                                                        <span className="text-center text-[#eaecef] font-mono">{coin.quantity.toFixed(4)}</span>
                                                        <span className="text-center text-[#eaecef] font-mono">{coin.avgPrice.toFixed(2)}</span>
                                                        <span className="text-center text-[#848e9c] font-mono">{totalCost.toFixed(2)}</span>
                                                        
                                                        <span className={`text-right font-mono ${livePrice > 0 ? (isProfit ? 'text-[#089981]' : 'text-[#F23645]') : 'text-[#848e9c]'}`}>
                                                            {livePrice > 0 ? (
                                                                <>
                                                                    {isProfit ? '+' : ''}{profit.toFixed(2)}
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px]">載入中...</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-sm font-bold text-[#848e9c] py-2">無持有資產</div>
                                    )}
                                </div>

                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded-full bg-[#2b3139] border border-[#474d57] overflow-hidden"><img src={photoURL || "https://via.placeholder.com/150"} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 space-y-2"><label className="text-xs text-[#848e9c]">顯示名稱</label><div className="flex gap-2"><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-1.5 text-sm text-white outline-none"/><button onClick={handleUpdateProfile} className="bg-[#f0b90b] px-3 rounded text-black font-bold">更新</button></div></div>
                                </div>
                                <button onClick={() => resetAccount(true, true)} className="w-full py-2 bg-[#F23645]/10 border border-[#F23645]/50 text-[#F23645] rounded text-sm">重置模擬帳戶</button>
                            </div>
                        ) : activeTab === "fees" ? (
                            <div className="space-y-6">
                                <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]">
                                    <label className="text-sm font-bold text-[#f0b90b] block mb-2">當前交易所 (影響新開單)</label>
                                    <select value={selectedExchange} onChange={handleExchangeChange} className="w-full bg-[#1e2329] border border-[#474d57] rounded p-2.5 text-sm text-white outline-none">
                                        <option value="Binance">Binance</option>
                                        <option value="MEXC">MEXC</option>
                                        <option value="OKX">OKX</option>
                                        <option value="Pionex">Pionex</option>
                                        <option value="Bybit">Bybit</option>
                                        <option value="Bitget">Bitget</option>
                                        <option value="Custom">Custom (自定義)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-[#848e9c]">現貨 Maker %</label><input type="number" step="0.001" value={tempFees.spotMaker} onChange={(e)=>setTempFees({...tempFees, spotMaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                    <div><label className="text-xs text-[#848e9c]">現貨 Taker %</label><input type="number" step="0.001" value={tempFees.spotTaker} onChange={(e)=>setTempFees({...tempFees, spotTaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                </div>
                                <button onClick={handleSaveFees} className="w-full py-3 bg-[#f0b90b] text-black font-bold rounded shadow-lg">儲存費率設定</button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between border-b border-[#2b3139] pb-3">
                                    <div className="flex gap-2">
                                        {["futures", "spot", "grid_futures", "grid_spot"].map(tab => {
                                            const labels = { futures: "合約", spot: "現貨", grid_futures: "合約網格", grid_spot: "現貨網格" };
                                            return (
                                                <button key={tab} onClick={() => setTransSubTab(tab)} className={"px-3 py-1 text-xs rounded transition-colors " + (transSubTab === tab ? "bg-[#f0b90b] text-black font-bold" : "bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef]")}>
                                                    {labels[tab]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1 bg-[#2b3139] border border-[#474d57] rounded text-xs text-[#848e9c] hover:text-[#f0b90b] transition-colors">
                                        <Download size={14} /> 匯出量化報表
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 bg-[#161a1e] text-[#848e9c] z-10">
                                            <tr className="border-b border-[#2b3139]">
                                                <th className="py-3 px-2 font-normal">成交時間</th>
                                                <th className="py-3 px-2 font-normal">幣種</th>
                                                <th className="py-3 px-2 font-normal">方向</th>
                                                <th className="py-3 px-2 font-normal">成交價格</th>
                                                <th className="py-3 px-2 font-normal">成交數量</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[#eaecef]">
                                            {filteredHistory.length > 0 ? (
                                                filteredHistory.map((item, index) => {
                                                    const isLong = item.side === "long" || item.side === "buy";
                                                    const sideText = transSubTab.includes("futures") ? (item.side === "long" ? "做多" : "做空") : (item.side === "long" || item.side === "buy" ? "買入" : "賣出");
                                                    return (
                                                        <tr key={index} className="border-b border-[#2b3139] hover:bg-[#2b3139]/50 transition-colors">
                                                            <td className="py-3 px-2 font-mono text-[#848e9c]">{item.exitTime || item.time}</td>
                                                            <td className="py-3 px-2 font-bold">{item.symbol}</td>
                                                            <td className={"py-3 px-2 " + (isLong ? "text-[#089981]" : "text-[#F23645]")}>{sideText}</td>
                                                            <td className="py-3 px-2 font-mono">{(item.entryPrice || item.price || 0).toFixed(2)}</td>
                                                            <td className="py-3 px-2 font-mono">{(item.size || 0).toFixed(4)}</td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr><td colSpan="5" className="py-20 text-center text-[#848e9c] italic">尚無歷史紀錄</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileSet;