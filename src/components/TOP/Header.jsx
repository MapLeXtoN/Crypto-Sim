// src/components/TOP/Header.jsx
import React, { useState } from 'react';
import ChangeCoin from './ChangeCoin';
import UserProfile from './UserProfile';
import UserProfileSet from './UserProfileSet';

const Header = ({ symbol, setSymbol, currentPrice, equity, balance, user, resetAccount, setUser, history = [], positions = [], feeSettings, setFeeSettings, selectedExchange, setSelectedExchange, heldCoins }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139] bg-[#181a20]">
          <ChangeCoin symbol={symbol} setSymbol={setSymbol} currentPrice={currentPrice} />
          <div><UserProfile user={user} equity={equity} balance={balance} onOpenSettings={() => setShowSettings(true)} /></div>
      </header>

      {showSettings && (
        <UserProfileSet 
            user={user} setUser={setUser} resetAccount={resetAccount} history={history}
            equity={equity} balance={balance} positions={positions} currentPrice={currentPrice} currentSymbol={symbol}      
            feeSettings={feeSettings} setFeeSettings={setFeeSettings}
            selectedExchange={selectedExchange} setSelectedExchange={setSelectedExchange}
            onClose={() => setShowSettings(false)}
            heldCoins={heldCoins}
        />
      )}
    </>
  );
};

export default Header;