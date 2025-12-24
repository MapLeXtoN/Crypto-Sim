// src/components/TOP/UserProfileSet.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Save, User, DollarSign, Settings, Download, TrendingUp, RefreshCcw, Upload } from "lucide-react";
import { updateProfile, updatePassword } from "firebase/auth";
import { formatMoney } from "../../utils"; 
import { INITIAL_BALANCE } from "../../constants"; // 確保獲取基準本金進行 ROI 計算

const UserProfileSet = ({ user, onClose, resetAccount, setUser, history = [], equity, balance, positions = [], currentPrice, currentSymbol, feeSettings, setFeeSettings, selectedExchange, setSelectedExchange, heldCoins }) => {
    
    const [activeTab, setActiveTab] = useState("profile");
    const [transSubTab, setTransSubTab] = useState("futures"); // 交易明細子分頁狀態
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [newPassword, setNewPassword] = useState("");
    const [photoURL, setPhotoURL] = useState(user.photoURL || "");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    
    // 費率設定暫存
    const [tempFees, setTempFees] = useState(feeSettings);

    // 根據子分頁過濾歷史紀錄
    const filteredHistory = useMemo(() => {
        const modeMap = {
            "futures": "futures",
            "spot": "spot",
            "grid_futures": "grid_futures",
            "grid_spot": "grid_spot"
        };
        return history.filter(item => item.mode === modeMap[transSubTab]);
    }, [history, transSubTab]);

    // 🛠️ 實作專業量化分析 CSV 匯出邏輯 (已中文化並移除交易編號)
    const handleExport = () => {
        const labels = { futures: "合約", spot: "現貨", grid_futures: "合約網格", grid_spot: "現貨網格" };
        const currentLabel = labels[transSubTab];
        
        if (filteredHistory.length === 0) {
            alert("目前無歷史紀錄可供匯出");
            return;
        }

        alert("正在執行量化分析並匯出 [" + currentLabel + "] 報表...");

        // 🛠️ 2️⃣ 專業化標題欄位 (移除 ID，改為全中文)
        const headers = [
            "平倉時間", 
            "交易幣種", 
            "方向", 
            "成交均價", 
            "成交數量", 
            "手續費 (USDT)", 
            "已實現盈虧 (USDT)", 
            "單筆投報率 (%)", 
            "交易效率 (盈虧/手續費)"
        ];
        
        let totalVolume = 0;
        let totalFee = 0;
        let totalPnL = 0;

        // 轉換資料並計算量化指標
        const rows = filteredHistory.map(item => {
            // 方向中文化
            const sideText = transSubTab.includes("futures") 
                ? (item.side === "long" ? "做多 (LONG)" : "做空 (SHORT)") 
                : (item.side === "long" || item.side === "buy" ? "買入 (BUY)" : "賣出 (SELL)");

            const price = parseFloat(item.entryPrice || item.price || 0);
            const size = parseFloat(item.size || 0);
            const amount = parseFloat(item.amount || (price * size));
            
            // 手續費計算
            const fee = parseFloat(item.entryFee || (amount * (item.feeRate || 0) / 100) || 0);
            
            // 盈虧與 ROI
            const pnl = parseFloat(item.pnl || 0);
            const roi = amount > 0 ? (pnl / amount) * 100 : 0;

            // 交易效率 (Efficiency)
            const efficiency = fee > 0 ? (pnl / fee).toFixed(2) : "-";

            // 累加總計
            totalVolume += amount;
            totalFee += fee;
            totalPnL += pnl;

            // 回傳資料列 (注意順序要跟 headers 一樣，並移除了 ID)
            return [
                item.exitTime || item.time,  // 平倉時間
                item.symbol,                 // 交易幣種
                sideText,                    // 方向
                price.toFixed(2),            // 成交均價
                size.toFixed(4),             // 成交數量
                fee.toFixed(4),              // 手續費
                pnl.toFixed(2),              // 已實現盈虧
                roi.toFixed(2) + "%",        // 單筆投報率
                efficiency                   // 交易效率
            ];
        });

        // 數據總結列 (Summary) - 調整為對齊上方欄位
        // 欄位索引: 0:時間, 1:幣種, 2:方向, 3:價格, 4:數量, 5:手續費, 6:盈虧, 7:ROI, 8:效率
        const summaryRow = [
            "總結 (SUMMARY)",
            "-",
            "-",
            "-",
            totalVolume.toFixed(2),      // 對齊「成交數量」
            totalFee.toFixed(4),         // 對齊「手續費」
            totalPnL.toFixed(2),         // 對齊「已實現盈虧」
            "-",
            "-"
        ];

        // 帳戶整體績效列 (Portfolio Performance)
        const portfolioRoi = (totalPnL / INITIAL_BALANCE) * 100;
        const portfolioRow = [
            "帳戶整體績效",
            "-",
            "-",
            "初始本金: " + INITIAL_BALANCE,
            "總淨利: " + totalPnL.toFixed(2),
            "總報酬率: " + portfolioRoi.toFixed(2) + "%",
            "-",
            "-",
            "-"
        ];

        // 組合內容 (使用 \uFEFF 解決 Excel 中文亂碼)
        const csvContent = "\uFEFF" + [headers, ...rows, [], summaryRow, portfolioRow].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        // 下載動作
        const link = document.createElement("a");
        link.setAttribute("href", url);
        // 下載檔名改為中文
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
            case "Binance":
                newRates = { ...newRates, spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05 };
                break;
            case "MEXC":
                newRates = { ...newRates, spotMaker: 0.0, spotTaker: 0.02, futuresMaker: 0.02, futuresTaker: 0.06 };
                break;
            case "OKX":
                newRates = { ...newRates, spotMaker: 0.08, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05 };
                break;
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
                {/* 側邊導航 */}
                <div className="w-1/4 bg-[#161a1e] border-r border-[#2b3139] flex flex-col">
                    <div className="p-6 border-b border-[#2b3139] font-bold text-[#f0b90b]">設定中心</div>
                    <nav className="flex-1 p-2 space-y-1">
                        <button onClick={() => setActiveTab("profile")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "profile" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><User size={18} /> 基本資料</button>
                        <button onClick={() => setActiveTab("fees")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "fees" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><DollarSign size={18} /> 手續費設定</button>
                        <button onClick={() => setActiveTab("transactions")} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm transition-colors ${activeTab === "transactions" ? "bg-[#2b3139] text-[#f0b90b]" : "text-[#848e9c] hover:bg-[#2b3139]"}`}><TrendingUp size={18} /> 交易明細</button>
                    </nav>
                    <button onClick={onClose} className="m-4 py-2 bg-[#2b3139] text-xs rounded">關閉設定</button>
                </div>

                {/* 內容區塊 */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#1e2329]">
                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
                        {statusMsg.text && <div className={`p-3 rounded text-sm text-center ${statusMsg.type === "success" ? "bg-[#089981]/20 text-[#089981]" : "bg-[#F23645]/20 text-[#F23645]"}`}>{statusMsg.text}</div>}
                        
                        {activeTab === "profile" ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">資產總額</div><div className="text-xl font-bold">{formatMoney(equity)}</div></div>
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">可用資金</div><div className="text-xl font-bold">{formatMoney(balance)}</div></div>
                                </div>

                                <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]">
                                    <div className="text-xs text-[#848e9c] mb-3 font-bold">持有的幣種詳細資產</div>
                                    {heldCoins && heldCoins.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-3 text-[10px] text-[#848e9c] uppercase border-b border-[#474d57] pb-1">
                                                <span>幣種</span>
                                                <span className="text-center">數量</span>
                                                <span className="text-right">平均價格</span>
                                            </div>
                                            {heldCoins.map((coin, index) => (
                                                <div key={index} className="grid grid-cols-3 text-sm font-bold items-center">
                                                    <span className="text-[#f0b90b]">{coin.symbol}</span>
                                                    <span className="text-center text-[#eaecef] font-mono">{coin.quantity.toFixed(4)}</span>
                                                    <span className="text-right text-[#eaecef] font-mono">{coin.avgPrice.toFixed(2)}</span>
                                                </div>
                                            ))}
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
                                        <option value="Binance">Binance (幣安)</option>
                                        <option value="MEXC">MEXC (抹茶)</option>
                                        <option value="OKX">OKX (歐易)</option>
                                        <option value="Custom">自定義 (Custom)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-[#848e9c]">現貨 Maker %</label><input type="number" step="0.001" value={tempFees.spotMaker} onChange={(e)=>setTempFees({...tempFees, spotMaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                    <div><label className="text-xs text-[#848e9c]">現貨 Taker %</label><input type="number" step="0.001" value={tempFees.spotTaker} onChange={(e)=>setTempFees({...tempFees, spotTaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                </div>
                                <button onClick={handleSaveFees} className="w-full py-3 bg-[#f0b90b] text-black font-bold rounded shadow-lg">儲存費率設定</button>
                            </div>
                        ) : (
                            /* 交易明細分頁內容 */
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex items-center justify-between border-b border-[#2b3139] pb-3">
                                    <div className="flex gap-2">
                                        {["futures", "spot", "grid_futures", "grid_spot"].map(tab => {
                                            const labels = { futures: "合約", spot: "現貨", grid_futures: "合約網格", grid_spot: "現貨網格" };
                                            return (
                                                <button 
                                                    key={tab}
                                                    onClick={() => setTransSubTab(tab)}
                                                    className={"px-3 py-1 text-xs rounded transition-colors " + (transSubTab === tab ? "bg-[#f0b90b] text-black font-bold" : "bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef]")}
                                                >
                                                    {labels[tab]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        onClick={handleExport}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-[#2b3139] border border-[#474d57] rounded text-xs text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                                    >
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
                                                    const sideText = transSubTab.includes("futures") 
                                                        ? (item.side === "long" ? "做多" : "做空") 
                                                        : (item.side === "long" || item.side === "buy" ? "買入" : "賣出");

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
                                                <tr>
                                                    <td colSpan="5" className="py-20 text-center text-[#848e9c] italic">尚無歷史紀錄</td>
                                                </tr>
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