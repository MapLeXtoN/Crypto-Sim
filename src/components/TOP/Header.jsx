// src/components/TOP/Header.jsx
import React, { useState } from 'react';
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';
import UserProfileSet from './UserProfileSet';

// 1. 注意這裡加入 resetAccount 和 setUser 到 props 中
const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user, resetAccount, setUser }) => {
  // 2. 新增狀態來控制設定視窗的顯示 (預設為 false 不顯示)
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
          {/* 3. 綁定 onClick 事件，點擊時將 showSettings 設為 true */}
          <div onClick={() => setShowSettings(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
              <UserProfile 
                  user={user} 
                  equity={equity} 
                  balance={balance} 
              />
          </div>
      </header>

      {/* 4. 條件渲染：只有當 showSettings 為 true 時才顯示設定視窗 */}
      {showSettings && (
        <UserProfileSet 
            user={user}
            setUser={setUser}           // 傳遞更新 user 狀態的函式
            resetAccount={resetAccount} // 傳遞重置帳號的函式
            onClose={() => setShowSettings(false)} // 傳遞關閉函式
        />
      )}
    </>
  );
};

export default Header;