// src/components/TOP/Header.jsx
import React from 'react';
// 引入拆分後的元件
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';

const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139] bg-[#181a20]">
        {/* 左側：幣種選擇與價格 */}
        <ChangeCoin 
            symbol={symbol} 
            setSymbol={setSymbol} 
            currentPrice={currentPrice} 
        />

        {/* 右側：使用者資訊與資產 */}
        <UserProfile 
            user={user} 
            equity={equity} 
            balance={balance} 
        />
    </header>
  );
};

export default Header;