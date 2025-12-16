// src/components/TOP/Header.jsx
import React, { useState } from 'react';
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';
import UserProfileSet from './UserProfileSet';

// 🔥 注意：新增 positions 給 UserProfileSet 使用
const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user, resetAccount, setUser, history = [], positions = [] }) => {
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
            
            // 🔥 傳遞資產相關數據
            equity={equity}
            balance={balance}
            positions={positions}       // 傳入持倉資料以顯示列表
            currentPrice={currentPrice} // 傳入即時價格以計算 ROI
            currentSymbol={symbol}      // 傳入當前幣種以判斷是否計算
            
            onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default Header;