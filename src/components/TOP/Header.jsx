// src/components/TOP/Header.jsx
import React, { useState } from 'react';
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';
import UserProfileSet from './UserProfileSet';

const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user, resetAccount, setUser, history = [], positions = [], marketPrices = {} }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139] bg-[#181a20]">
          {/* 左側：幣種選擇與價格 */}
          <ChangeCoin 
              symbol={symbol} 
              setSymbol={setSymbol} 
              currentPrice={currentPrice} 
          />

          {/* 右側：使用者資訊與資產 */}
          <div onClick={() => setShowSettings(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
              <UserProfile 
                  user={user} 
                  equity={equity} 
                  balance={balance} 
              />
          </div>
      </header>

      {/* 設定視窗 */}
      {showSettings && (
        <UserProfileSet 
            user={user}
            setUser={setUser}
            resetAccount={resetAccount}
            history={history}
            
            equity={equity}
            balance={balance}
            positions={positions}       
            currentPrice={currentPrice} 
            
            // 🔥 傳遞 marketPrices，讓設定頁面也能知道所有幣種的即時價格
            marketPrices={marketPrices} 

            onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default Header;