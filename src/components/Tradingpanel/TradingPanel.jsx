// src/components/TradingPanel/TradingPanel.jsx
import React from 'react';
import TradingPanelUI from './TradingPanelUI';

const TradingPanel = (props) => {
    // 這裡可以放更多下單邏輯，目前主要功能是將 props 轉發給 UI
    // 這樣做的好處是將 "運算" 與 "顯示" 分離
    return <TradingPanelUI {...props} />;
};

export default TradingPanel;