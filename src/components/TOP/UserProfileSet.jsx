// src/components/TOP/UserProfileSet.jsx
import React, { useState } from 'react';
import { X, Save, Lock, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';

const UserProfileModal = ({ user, onClose, resetAccount, setUser }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // 1. 更新顯示名稱
    const handleUpdateName = async () => {
        if (!displayName.trim()) return;
        try {
            await updateProfile(user, { displayName: displayName });
            // 強制更新 App.jsx 的 user 狀態，讓 Header 即時變更
            setUser({ ...user, displayName }); 
            setStatusMsg({ type: 'success', text: '名稱已更新' });
        } catch (error) {
            setStatusMsg({ type: 'error', text: '更新失敗: ' + error.message });
        }
    };

    // 2. 更新密碼
    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setStatusMsg({ type: 'error', text: '密碼長度需至少 6 位' });
            return;
        }
        try {
            await updatePassword(user, newPassword);
            setStatusMsg({ type: 'success', text: '密碼修改成功，下次請用新密碼登入' });
            setNewPassword('');
        } catch (error) {
            // Firebase 安全機制：如果登入太久，改密碼會失敗，要求重新登入
            if (error.code === 'auth/requires-recent-login') {
                setStatusMsg({ type: 'error', text: '為確保安全，請重新登入後再修改密碼' });
            } else {
                setStatusMsg({ type: 'error', text: error.message });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1e2329] w-full max-w-md rounded-lg shadow-2xl border border-[#2b3139] overflow-hidden animate-fade-in">
                
                {/* 標題列 */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#2b3139] bg-[#2b3139]/50">
                    <h2 className="text-lg font-bold text-[#eaecef]">帳號設定</h2>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* 狀態訊息提示 */}
                    {statusMsg.text && (
                        <div className={`p-3 rounded text-sm text-center ${statusMsg.type === 'success' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#F23645]/20 text-[#F23645]'}`}>
                            {statusMsg.text}
                        </div>
                    )}

                    {/* 區塊 1: 個人資料 */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#848e9c] uppercase tracking-wide">個人暱稱</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={displayName} 
                                onChange={(e) => setDisplayName(e.target.value)} 
                                placeholder="輸入您的顯示名稱"
                                className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white focus:border-[#f0b90b] outline-none transition-colors"
                            />
                            <button onClick={handleUpdateName} className="bg-[#f0b90b] hover:bg-[#d9a506] text-black px-4 rounded font-bold transition-colors flex items-center gap-2">
                                <Save size={16} /> 儲存
                            </button>
                        </div>
                    </div>

                    {/* 區塊 2: 安全設定 */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#848e9c] uppercase tracking-wide flex items-center gap-1">
                            <Lock size={12} /> 修改密碼
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="輸入新密碼"
                                className="flex-1 bg-[#2b3139] border border-[#474d57] rounded px-3 py-2 text-white focus:border-[#f0b90b] outline-none transition-colors"
                            />
                            <button onClick={handleChangePassword} className="bg-[#2b3139] hover:bg-[#373d45] border border-[#474d57] text-[#eaecef] px-4 rounded font-bold transition-colors">
                                修改
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[#2b3139] my-4"></div>

                    {/* 區塊 3: 危險區域 (重置) */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#F23645] uppercase tracking-wide flex items-center gap-1">
                            <AlertTriangle size={12} /> 重置模擬帳戶
                        </label>
                        <p className="text-xs text-[#848e9c] leading-relaxed">
                            這將會把您的資金恢復為 $100,000，並清除所有交易歷史紀錄與掛單。此動作無法復原。
                        </p>
                        <div className="flex gap-3 mt-2">
                            <button 
                                onClick={() => { resetAccount(true, true); onClose(); }} 
                                className="flex-1 py-2 bg-[#F23645]/10 hover:bg-[#F23645]/20 border border-[#F23645]/50 text-[#F23645] rounded transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <RefreshCcw size={16} /> 重置資金與紀錄
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileSet;