// src/components/TOP/UserProfile.jsx
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase'; 
import { formatMoney } from '../../utils'; 

const UserProfile = ({ user, equity, balance, onOpenSettings }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trader';
    const avatarUrl = user?.photoURL;

    // 點擊外部關閉選單
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-6 text-sm relative" ref={menuRef}>
            {/* 資產資訊區塊 (保持不變) */}
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                    <span className="text-[#848e9c] text-xs">總資產 (Equity)</span>
                    <span className={`font-mono font-bold ${equity >= 100000 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {formatMoney(equity)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#848e9c] text-xs">可用資金 (Available)</span>
                    <span className="font-mono text-[#eaecef]">
                        {formatMoney(balance)}
                    </span>
                </div>
            </div>

            {/* 🔥 右側頭像與下拉選單觸發器 */}
            <div 
                className="flex items-center gap-3 border-l border-[#2b3139] pl-4 cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <div className="flex items-center gap-2">
                    {/* 頭像 */}
                    <div className="w-9 h-9 rounded-full bg-[#2b3139] border border-[#474d57] flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-105">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={18} className="text-[#848e9c]" />
                        )}
                    </div>
                    <ChevronDown size={12} className={`text-[#848e9c] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* 🔥 下拉選單 Menu */}
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e2329] border border-[#474d57] rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
                    {/* Menu Header: 頭像與暱稱 */}
                    <div className="p-4 border-b border-[#2b3139] bg-[#2b3139]/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2b3139] border border-[#474d57] flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={20} className="text-[#848e9c]" />
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-[#eaecef] truncate">{displayName}</span>
                            <span className="text-xs text-[#848e9c] truncate">{user?.email}</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        <button 
                            onClick={() => { setIsMenuOpen(false); onOpenSettings(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#eaecef] hover:bg-[#2b3139] rounded transition-colors"
                        >
                            <Settings size={16} className="text-[#f0b90b]" />
                            帳號詳情
                        </button>
                        
                        <div className="border-t border-[#2b3139] my-1"></div>

                        <button 
                            onClick={() => signOut(auth)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#F23645] hover:bg-[#F23645]/10 rounded transition-colors"
                        >
                            <LogOut size={16} />
                            登出帳號
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;