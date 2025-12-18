// src/components/TOP/Header.jsx
import React, { useState } from 'react';
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';
import UserProfileSet from './UserProfileSet';

// 🔥 接收 feeSettings, setFeeSettings
const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user, resetAccount, setUser, history = [], positions = [], feeSettings, setFeeSettings }) => {
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
          <div>
              <UserProfile 
                  user={user} 
                  equity={equity} 
                  balance={balance}
                  onOpenSettings={() => setShowSettings(true)} 
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
            currentSymbol={symbol}      
            
            // 🔥 傳入費率設定
            feeSettings={feeSettings}
            setFeeSettings={setFeeSettings}

            onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default Header;