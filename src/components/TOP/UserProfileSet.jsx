// src/components/TOP/UserProfileSet.jsx
import React, { useState, useMemo } from 'react';
import { X, Save, Lock, RefreshCcw, Upload, Download, FileText, Wallet, TrendingUp, DollarSign, Settings, User } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { formatMoney } from '../../utils'; 

const UserProfileSet = ({ user, onClose, resetAccount, setUser, history = [], equity, balance, positions = [], currentPrice, currentSymbol, feeSettings, setFeeSettings }) => {
    
    // 🔥 新增：分頁狀態 ('profile' | 'fees')
    const [activeTab, setActiveTab] = useState('profile');

    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    
    // 費率設定暫存狀態 (避免改一個字就更新 App)
    const [tempFees, setTempFees] = useState(feeSettings || {
        vipLevel: 'VIP0',
        spotMaker: 0.1, spotTaker: 0.1,
        futuresMaker: 0.02, futuresTaker: 0.05,
        fundingRate: 0.01
    });

    const [hasExported, setHasExported] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // 1. 更新個人資料
    const handleUpdateProfile = async () => {
        if (!displayName.trim()) return;
        try {
            await updateProfile(user, { displayName, photoURL });
            setUser({ ...user, displayName, photoURL }); 
            setStatusMsg({ type: 'success', text: '個人資料已更新' });
        } catch (error) {
            setStatusMsg({ type: 'error', text: '更新失敗: ' + error.message });
        }
    };

    const handleAvatarChange = () => {
        const url = prompt("請輸入頭像圖片網址 (URL):", photoURL);
        if (url !== null) setPhotoURL(url);
    };

    // 2. 更新密碼
    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setStatusMsg({ type: 'error', text: '密碼長度需至少 6 位' });
            return;
        }
        try {
            await updatePassword(user, newPassword);
            setStatusMsg({ type: 'success', text: '密碼修改成功' });
            setNewPassword('');
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') {
                setStatusMsg({ type: 'error', text: '請重新登入後再修改密碼' });
            } else {
                setStatusMsg({ type: 'error', text: error.message });
            }
        }
    };

    // 3. 匯出 CSV
    const handleExportHistory = () => {
        if (!history || history.length === 0) {
            setStatusMsg({ type: 'error', text: '無交易紀錄可匯出' });
            return;
        }
        const headers = ["ID", "Time", "Symbol", "Side", "Type", "Price", "Size", "PnL"];
        const rows = history.map(item => [
            item.id, item.exitTime || item.time, item.symbol, item.side, item.mode, item.entryPrice, item.size, item.pnl || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `trading_history_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setHasExported(true);
        setStatusMsg({ type: 'success', text: '匯出成功！' });
    };

    // 4. 重置帳號
    const handleResetClick = () => {
        if (!hasExported && history.length > 0) {
            setShowResetConfirm(true);
        } else {
            resetAccount(true, true);
            onClose();
        }
    };

    // 5. 🔥 費率預設值 (VIP Levels)
    const handleVipChange = (e) => {
        const vip = e.target.value;
        let newRates = { ...tempFees, vipLevel: vip };
        
        // 模擬各大交易所的 VIP 階梯
        switch(vip) {
            case 'VIP0': newRates = { ...newRates, spotMaker: 0.1, spotTaker: 0.1, futuresMaker: 0.02, futuresTaker: 0.05 }; break;
            case 'VIP1': newRates = { ...newRates, spotMaker: 0.09, spotTaker: 0.1, futuresMaker: 0.016, futuresTaker: 0.04 }; break;
            case 'VIP2': newRates = { ...newRates, spotMaker: 0.08, spotTaker: 0.1, futuresMaker: 0.014, futuresTaker: 0.035 }; break;
            case 'VIP3': newRates = { ...newRates, spotMaker: 0.042, spotTaker: 0.06, futuresMaker: 0.01, futuresTaker: 0.032 }; break;
            default: break;
        }
        setTempFees(newRates);
    };

    // 6. 🔥 儲存費率設定
    const handleSaveFees = () => {
        setFeeSettings(tempFees);
        setStatusMsg({ type: 'success', text: '費率設定已更新' });
    };

    // 聚合現貨資產邏輯
    const aggregatedSpotAssets = useMemo(() => {
        const grouped = positions
            .filter(p => p.mode === 'spot')
            .reduce((acc, pos) => {
                if (!acc[pos.symbol]) {
                    acc[pos.symbol] = {
                        symbol: pos.symbol,
                        size: 0,
                        totalCost: 0,
                    };
                }
                acc[pos.symbol].size += pos.size;
                acc[pos.symbol].totalCost += (pos.size * pos.entryPrice);
                return acc;
            }, {});

        return Object.values(grouped).map(item => ({
            ...item,
            avgPrice: item.totalCost / item.size
        }));
    }, [positions]);

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1e2329] w-full max-w-4xl h-[600px] rounded-lg shadow-2xl border border-[#2b3139] overflow-hidden flex animate-fade-in">
                
                {/* 🔥 左側選單 (Sidebar) */}
                <div className="w-1/4 bg-[#161a1e] border-r border-[#2b3139] flex flex-col">
                    <div className="p-6 border-b border-[#2b3139]">
                        <h2 className="text-lg font-bold text-[#eaecef] flex items-center gap-2">
                            <Settings size={20} className="text-[#f0b90b]"/> 設定
                        </h2>
                    </div>
                    <nav className="flex-1 p-2 space-y-1">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[#2b3139] text-[#f0b90b]' : 'text-[#848e9c] hover:bg-[#2b3139] hover:text-[#eaecef]'}`}
                        >
                            <User size={18} /> 基本資料與資產
                        </button>
                        <button 
                            onClick={() => setActiveTab('fees')}
                            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === 'fees' ? 'bg-[#2b3139] text-[#f0b90b]' : 'text-[#848e9c] hover:bg-[#2b3139] hover:text-[#eaecef]'}`}
                        >
                            <DollarSign size={18} /> 手續費與資金費率
                        </button>
                    </nav>
                    <div className="p-4 border-t border-[#2b3139]">
                        <button onClick={onClose} className="w-full py-2 bg-[#2b3139] hover:bg-[#373d45] text-[#eaecef] rounded text-sm transition-colors">
                            關閉選單
                        </button>
                    </div>
                </div>

                {/* 🔥 右側內容區 (Content) */}
                <div className="flex-1 bg-[#1e2329] flex flex-col overflow-hidden">
                    
                    {/* 頂部標題 */}
                    <div className="px-8 py-6 border-b border-[#2b3139]">
                        <h3 className="text-xl font-bold text-[#eaecef]">
                            {activeTab === 'profile' ? '基本資料與資產' : '手續費與資金費率設定'}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        
                        {/* 狀態訊息 */}
                        {statusMsg.text && (
                            <div className={`p-3 rounded text-sm text-center ${statusMsg.type === 'success' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#F23645]/20 text-[#F23645]'}`}>
                                {statusMsg.text}
                            </div>
                        )}

                        {/* --- TAB 1: 個人資料與資產 --- */}
                        {activeTab === 'profile' && (
                            <>
                                {/* 資產總覽 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#2b3139]/50 p-4 rounded border border-[#474d57]">
                                        <div className="text-xs text-[#848e9c] mb-1">總資產估值 (Equity)</div>
                                        <div className={`text-xl font-mono font-bold ${equity >= 100000 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                            {formatMoney(equity)}
                                        </div>
                                    </div>
                                    <div className="bg-[#2b3139]/50 p-4 rounded border border-[#474d57]">
                                        <div className="text-xs text-[#848e9c] mb-1">可用資金 (Available Balance)</div>
                                        <div className="text-xl font-mono font-bold text-[#eaecef]">
                                            {formatMoney(balance)}
                                        </div>
                                    </div>
                                </div>

                                {/* 現貨列表 */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#f0b90b] uppercase tracking-wide flex items-center gap-1">
                                        <TrendingUp size={14} /> 現貨持倉 (Spot Assets)
                                    </label>
                                    <div className="bg-[#2b3139] rounded border border-[#474d57] overflow-hidden">
                                        <table className="w-full text-left text-xs text-[#eaecef]">
                                            <thead className="bg-[#363c45] text-[#848e9c]">
                                                <tr>
                                                    <th className="pl-4 py-2">幣種</th>
                                                    <th>總持有量</th>
                                                    <th>平均買入價</th>
                                                    <th>價值 / 報酬率</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aggregatedSpotAssets.length > 0 ? aggregatedSpotAssets.map(pos => {
                                                    const isCurrentSymbol = pos.symbol === currentSymbol;
                                                    const displayPrice = isCurrentSymbol ? currentPrice : pos.avgPrice;
                                                    const value = pos.size * displayPrice;
                                                    const roi = ((displayPrice - pos.avgPrice) / pos.avgPrice) * 100;

                                                    return (
                                                        <tr key={pos.symbol} className="border-b border-[#474d57]/50 hover:bg-[#363c45]">
                                                            <td className="pl-4 py-2 font-bold">{pos.symbol}</td>
                                                            <td>{pos.size.toFixed(4)}</td>
                                                            <td>${pos.avgPrice.toFixed(2)}</td>
                                                            <td>
                                                                <div className="flex flex-col">
                                                                    <span>${value.toFixed(2)}</span>
                                                                    {isCurrentSymbol ? (
                                                                        <span className={`text-[10px] ${roi >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[#848e9c] text-[10px]">切換幣種查看</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">無現貨資產</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="border-t border-[#2b3139]"></div>

                                {/* 個人資料設定區 (省略詳細排版，保持原本功能) */}
                                <div className="flex gap-4 items-start">
                                    <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarChange}>
                                        <div className="w-16 h-16 rounded-full bg-[#2b3139] border border-[#474d57] overflow-hidden">
                                            <img src={photoURL || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={16} className="text-white"/></div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-[#848e9c]">顯示名稱</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-1.5 text-white outline-none text-sm"/>
                                            <button onClick={handleUpdateProfile} className="bg-[#f0b90b] hover:bg-[#d9a506] text-black px-3 rounded font-bold text-xs"><Save size={14}/></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-[#2b3139] p-3 rounded border border-[#474d57]">
                                    <div className="text-sm text-[#eaecef] flex items-center gap-2"><FileText size={16} className="text-[#848e9c]" /> 匯出交易歷史紀錄</div>
                                    <button onClick={handleExportHistory} className="flex items-center gap-2 px-3 py-1.5 bg-[#474d57] text-white rounded text-xs"><Download size={12} /> 匯出 CSV</button>
                                </div>

                                {!showResetConfirm ? (
                                    <button onClick={handleResetClick} className="w-full py-2 bg-[#F23645]/10 hover:bg-[#F23645]/20 border border-[#F23645]/50 text-[#F23645] rounded text-sm flex items-center justify-center gap-2"><RefreshCcw size={14} /> 重置模擬帳戶</button>
                                ) : (
                                    <div className="bg-[#F23645]/10 border border-[#F23645] rounded p-3 text-center space-y-2">
                                        <p className="text-[#F23645] font-bold text-xs">⚠️ 確定要重置嗎？</p>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => { resetAccount(true, true); onClose(); }} className="px-3 py-1 bg-[#F23645] text-white rounded text-xs">確認重置</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* --- TAB 2: 手續費與費率設定 (新增功能) --- */}
                        {activeTab === 'fees' && (
                            <div className="space-y-6">
                                {/* VIP 等級選擇 */}
                                <div>
                                    <label className="text-sm font-bold text-[#eaecef] mb-2 block">VIP 等級 (快速套用)</label>
                                    <select 
                                        value={tempFees.vipLevel} 
                                        onChange={handleVipChange} 
                                        className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"
                                    >
                                        <option value="VIP0">VIP 0 (一般用戶)</option>
                                        <option value="VIP1">VIP 1</option>
                                        <option value="VIP2">VIP 2</option>
                                        <option value="VIP3">VIP 3 (高資產)</option>
                                    </select>
                                    <p className="text-xs text-[#848e9c] mt-1">選擇 VIP 等級會自動帶入對應的市場手續費率。</p>
                                </div>

                                <div className="border-t border-[#2b3139]"></div>

                                {/* 現貨費率 */}
                                <div>
                                    <h4 className="text-[#f0b90b] text-sm font-bold mb-3 flex items-center gap-2"><TrendingUp size={16}/> 現貨手續費 (Spot Fees)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-[#848e9c] mb-1 block">掛單 (Maker) %</label>
                                            <input type="number" step="0.001" value={tempFees.spotMaker} onChange={(e)=>setTempFees({...tempFees, spotMaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"/>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#848e9c] mb-1 block">吃單 (Taker) %</label>
                                            <input type="number" step="0.001" value={tempFees.spotTaker} onChange={(e)=>setTempFees({...tempFees, spotTaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"/>
                                        </div>
                                    </div>
                                </div>

                                {/* 合約費率 */}
                                <div>
                                    <h4 className="text-[#f0b90b] text-sm font-bold mb-3 flex items-center gap-2"><Settings size={16}/> 合約手續費 (Futures Fees)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-[#848e9c] mb-1 block">掛單 (Maker) %</label>
                                            <input type="number" step="0.001" value={tempFees.futuresMaker} onChange={(e)=>setTempFees({...tempFees, futuresMaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"/>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#848e9c] mb-1 block">吃單 (Taker) %</label>
                                            <input type="number" step="0.001" value={tempFees.futuresTaker} onChange={(e)=>setTempFees({...tempFees, futuresTaker: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"/>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[#2b3139]"></div>

                                {/* 資金費率 */}
                                <div>
                                    <h4 className="text-[#f0b90b] text-sm font-bold mb-3 flex items-center gap-2"><DollarSign size={16}/> 資金費率 (Funding Rate)</h4>
                                    <div>
                                        <label className="text-xs text-[#848e9c] mb-1 block">預設資金費率 (% / 8hr)</label>
                                        <input type="number" step="0.0001" value={tempFees.fundingRate} onChange={(e)=>setTempFees({...tempFees, fundingRate: parseFloat(e.target.value)})} className="w-full bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white outline-none focus:border-[#f0b90b]"/>
                                        <p className="text-[10px] text-[#848e9c] mt-1">* 此費率將用於計算合約持倉成本與模擬扣款</p>
                                    </div>
                                </div>

                                <button onClick={handleSaveFees} className="w-full py-3 bg-[#f0b90b] hover:bg-[#d9a506] text-black font-bold rounded shadow-lg transition-transform active:scale-95">
                                    儲存設定 (Save Settings)
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileSet;