// src/components/TOP/UserProfile.jsx
import React, { useState } from 'react';
import { UserCircle, LogOut, Wallet } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { formatMoney } from '../../utils';

const UserProfile = ({ user, equity, balance, onOpenSettings }) => {
    // 控制下拉選單開關
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // 🔥 新增：圖片載入錯誤狀態
    const [imgError, setImgError] = useState(false);

    const handleLogout = async () => {
        if (window.confirm("確定要登出嗎？")) {
            await signOut(auth);
        }
    };

    return (
        <div className="flex items-center gap-4">
            
            {/* 1. 資產顯示區 */}
            <div className="flex flex-col items-end mr-2 cursor-default select-text">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#848e9c]">總資產</span>
                    {/* 這裡加一個檢查，如果是 NaN 顯示 0.00 */}
                    <span className={`font-mono font-bold ${equity >= 100000 ? 'text-[#089981]' : 'text-[#eaecef]'}`}>
                        {isNaN(equity) ? '$0.00' : formatMoney(equity)}
                    </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="text-[#848e9c]">可用</span>
                    <span className="font-mono font-bold text-[#eaecef]">
                        {formatMoney(balance)}
                    </span>
                </div>
            </div>

            {/* 2. 頭像區 */}
            <div className="relative">
                <div 
                    className="cursor-pointer hover:ring-2 hover:ring-[#474d57] rounded-full transition-all"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title="帳號設定"
                >
                    {/* 🔥 圖片顯示邏輯：有 URL 且 沒有錯誤 才顯示圖片 */}
                    {user?.photoURL && !imgError ? (
                        <img 
                            src={user.photoURL} 
                            alt="Avatar" 
                            className="w-9 h-9 rounded-full border border-[#474d57] object-cover bg-[#2b3139]" 
                            onError={() => setImgError(true)} // 載入失敗時切換狀態
                        />
                    ) : (
                        <UserCircle size={36} className="text-[#848e9c] bg-[#2b3139] rounded-full" />
                    )}
                </div>

                {/* 下拉選單 */}
                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e2329] border border-[#474d57] rounded shadow-xl z-50 overflow-hidden animate-fade-in">
                            <div className="px-4 py-3 border-b border-[#2b3139] bg-[#2b3139]/30">
                                <div className="text-sm font-bold text-white truncate">{user.displayName || 'User'}</div>
                                <div className="text-xs text-[#848e9c] truncate mt-0.5">{user.email}</div>
                            </div>

                            <div className="py-1">
                                <button 
                                    onClick={() => {
                                        onOpenSettings();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-[#eaecef] hover:bg-[#2b3139] flex items-center gap-3 transition-colors"
                                >
                                    <Wallet size={16} className="text-[#f0b90b]" /> 
                                    <span>帳號詳情與資產</span>
                                </button>
                            </div>

                            <div className="border-t border-[#2b3139] py-1">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-[#F23645] hover:bg-[#F23645]/10 flex items-center gap-3 transition-colors"
                                >
                                    <LogOut size={16} /> 
                                    <span>登出帳號</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfile;