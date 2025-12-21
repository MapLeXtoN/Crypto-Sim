// src/components/TOP/UserProfileSet.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Save, User, DollarSign, Settings, Download, TrendingUp, RefreshCcw, Upload } from "lucide-react";
import { updateProfile, updatePassword } from "firebase/auth";
import { formatMoney } from "../../utils"; 

const UserProfileSet = ({ user, onClose, resetAccount, setUser, history = [], equity, balance, positions = [], currentPrice, currentSymbol, feeSettings, setFeeSettings, selectedExchange, setSelectedExchange, heldCoins }) => {
    
    const [activeTab, setActiveTab] = useState("profile");
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [newPassword, setNewPassword] = useState("");
    const [photoURL, setPhotoURL] = useState(user.photoURL || "");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    
    // 費率設定暫存
    const [tempFees, setTempFees] = useState(feeSettings);

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
        setSelectedExchange(exchange); // 同步 App 狀態

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
                    </nav>
                    <button onClick={onClose} className="m-4 py-2 bg-[#2b3139] text-xs rounded">關閉設定</button>
                </div>

                {/* 內容區塊 */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#1e2329]">
                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        {statusMsg.text && <div className={`p-3 rounded text-sm text-center ${statusMsg.type === "success" ? "bg-[#089981]/20 text-[#089981]" : "bg-[#F23645]/20 text-[#F23645]"}`}>{statusMsg.text}</div>}
                        
                        {activeTab === "profile" ? (
                            <div className="space-y-6">
                                {/* 資產摘要 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">資產總額</div><div className="text-xl font-bold">{formatMoney(equity)}</div></div>
                                    <div className="bg-[#2b3139] p-4 rounded border border-[#474d57]"><div className="text-xs text-[#848e9c] mb-1">可用資金</div><div className="text-xl font-bold">{formatMoney(balance)}</div></div>
                                </div>

                                {/* 🛠️ 1️⃣ 修改：幣種資訊區塊移至基本資料中 */}
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

                                {/* 個人資料設定 */}
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded-full bg-[#2b3139] border border-[#474d57] overflow-hidden"><img src={photoURL || "https://via.placeholder.com/150"} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 space-y-2"><label className="text-xs text-[#848e9c]">顯示名稱</label><div className="flex gap-2"><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-1.5 text-sm text-white outline-none"/><button onClick={handleUpdateProfile} className="bg-[#f0b90b] px-3 rounded text-black font-bold">更新</button></div></div>
                                </div>
                                <button onClick={() => resetAccount(true, true)} className="w-full py-2 bg-[#F23645]/10 border border-[#F23645]/50 text-[#F23645] rounded text-sm">重置模擬帳戶</button>
                            </div>
                        ) : (
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

                                {/* 🛠️ 1️⃣ 修改：此處原本錯誤的幣種資訊區塊已移除 */}

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-[#848e9c]">現貨 Maker %</label><input type="number" step="0.001" value={tempFees.spotMaker} onChange={(e)=>setTempFees({...tempFees, spotMaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                    <div><label className="text-xs text-[#848e9c]">現貨 Taker %</label><input type="number" step="0.001" value={tempFees.spotTaker} onChange={(e)=>setTempFees({...tempFees, spotTaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none"/></div>
                                </div>
                                <button onClick={handleSaveFees} className="w-full py-3 bg-[#f0b90b] text-black font-bold rounded shadow-lg">儲存費率設定</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileSet;