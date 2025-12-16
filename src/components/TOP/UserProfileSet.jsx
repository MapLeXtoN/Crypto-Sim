// src/components/TOP/UserProfileSet.jsx
import React, { useState, useMemo } from 'react';
import { X, Save, Lock, RefreshCcw, Upload, Download, FileText, Wallet, TrendingUp } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { formatMoney } from '../../utils'; 

const UserProfileSet = ({ user, onClose, resetAccount, setUser, history = [], equity, balance, positions = [], currentPrice, marketPrices = {} }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    
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

    // 聚合現貨資產
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
            <div className="bg-[#1e2329] w-full max-w-2xl rounded-lg shadow-2xl border border-[#2b3139] overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#2b3139] bg-[#2b3139]/50 shrink-0">
                    <h2 className="text-lg font-bold text-[#eaecef] flex items-center gap-2">
                        <Wallet size={20} className="text-[#f0b90b]"/> 帳號詳情與資產
                    </h2>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* 狀態訊息 */}
                    {statusMsg.text && (
                        <div className={`p-3 rounded text-sm text-center ${statusMsg.type === 'success' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#F23645]/20 text-[#F23645]'}`}>
                            {statusMsg.text}
                        </div>
                    )}

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

                    {/* 現貨持倉詳情 */}
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
                                        <th>平均買入價 (Avg)</th>
                                        <th>即時價值 / 報酬率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedSpotAssets.length > 0 ? aggregatedSpotAssets.map(pos => {
                                        // 🔥 使用全市場價格計算，不再受當前看盤幣種限制
                                        const realTimePrice = marketPrices[pos.symbol] || pos.avgPrice;
                                        
                                        const value = pos.size * realTimePrice;
                                        const roi = ((realTimePrice - pos.avgPrice) / pos.avgPrice) * 100;

                                        return (
                                            <tr key={pos.symbol} className="border-b border-[#474d57]/50 hover:bg-[#363c45]">
                                                <td className="pl-4 py-2 font-bold">{pos.symbol}</td>
                                                <td>{pos.size.toFixed(4)}</td>
                                                <td>${pos.avgPrice.toFixed(2)}</td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span>${value.toFixed(2)}</span>
                                                        <span className={`text-[10px] ${roi >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                                        </span>
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

                    {/* 個人資料 & 安全設定 & 匯出 & 重置 (保持不變) */}
                    <div className="flex gap-4 items-start">
                        <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarChange}>
                            <div className="w-16 h-16 rounded-full bg-[#2b3139] border border-[#474d57] overflow-hidden">
                                <img src={photoURL || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={16} className="text-white"/>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-[#848e9c]">顯示名稱</label>
                            <div className="flex gap-2">
                                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-1.5 text-white focus:border-[#f0b90b] outline-none text-sm" />
                                <button onClick={handleUpdateProfile} className="bg-[#f0b90b] hover:bg-[#d9a506] text-black px-3 rounded font-bold text-xs"><Save size={14}/></button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#848e9c] flex items-center gap-1"><Lock size={12} /> 修改密碼</label>
                        <div className="flex gap-2">
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="輸入新密碼" className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-1.5 text-white focus:border-[#f0b90b] outline-none text-sm" />
                            <button onClick={handleChangePassword} className="bg-[#2b3139] hover:bg-[#373d45] border border-[#474d57] text-[#eaecef] px-3 rounded text-xs">修改</button>
                        </div>
                    </div>

                    <div className="border-t border-[#2b3139]"></div>

                    <div className="flex items-center justify-between bg-[#2b3139] p-3 rounded border border-[#474d57]">
                        <div className="text-sm text-[#eaecef] flex items-center gap-2"><FileText size={16} className="text-[#848e9c]" /> 匯出交易歷史紀錄</div>
                        <button onClick={handleExportHistory} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${hasExported ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#474d57] text-white'}`}><Download size={12} /> {hasExported ? '已匯出' : '匯出 CSV'}</button>
                    </div>

                    <div className="pt-2">
                        {!showResetConfirm ? (
                            <button onClick={handleResetClick} className="w-full py-2 bg-[#F23645]/10 hover:bg-[#F23645]/20 border border-[#F23645]/50 text-[#F23645] rounded text-sm flex items-center justify-center gap-2"><RefreshCcw size={14} /> 重置模擬帳戶</button>
                        ) : (
                            <div className="bg-[#F23645]/10 border border-[#F23645] rounded p-3 text-center space-y-2">
                                <p className="text-[#F23645] font-bold text-xs">⚠️ 尚未匯出紀錄！確定要重置嗎？</p>
                                <div className="flex gap-2 justify-center"><button onClick={handleExportHistory} className="px-3 py-1 bg-[#2b3139] border border-[#474d57] text-white rounded text-xs">先匯出</button><button onClick={() => { resetAccount(true, true); onClose(); }} className="px-3 py-1 bg-[#F23645] text-white rounded text-xs">確認重置</button></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileSet;