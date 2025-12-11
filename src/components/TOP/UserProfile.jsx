// src/components/TOP/UserProfile.jsx
import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase'; // 請確認路徑是否正確
import { formatMoney } from '../../utils'; // 請確認路徑是否正確

const UserProfile = ({ user, equity, balance }) => {
    // 取得顯示名稱
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trader';
    // 取得頭像 URL
    const avatarUrl = user?.photoURL;

    return (
        <div className="flex items-center gap-6 text-sm">
            {/* 資產資訊區塊 */}
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

            {/* 使用者頭像與登出區塊 */}
            <div className="flex items-center gap-3 border-l border-[#2b3139] pl-4">
                <div className="flex items-center gap-3">
                    {/* 頭像 */}
                    <div className="w-9 h-9 rounded-full bg-[#2b3139] border border-[#474d57] flex items-center justify-center overflow-hidden shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={18} className="text-[#848e9c]" />
                        )}
                    </div>
                    
                    {/* 名稱 */}
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#eaecef] leading-tight">{displayName}</span>
                        <span className="text-[10px] text-[#848e9c] leading-tight max-w-[100px] truncate">
                            {user?.email}
                        </span>
                    </div>
                </div>

                {/* 登出按鈕 */}
                <button 
                    onClick={() => signOut(auth)} 
                    className="ml-2 p-2 hover:bg-[#2b3139] rounded-full text-[#848e9c] hover:text-[#F23645] transition-colors" 
                    title="登出"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
};

export default UserProfile;