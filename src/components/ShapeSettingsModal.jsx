import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';

const ShapeSettingsModal = ({ shape, onSave, onClose, onDelete }) => {
    const [color, setColor] = useState(shape.color || '#2962FF');
    const [width, setWidth] = useState(shape.width || 2);
    const [lineStyle, setLineStyle] = useState(shape.lineStyle || 'SOLID');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" style={{ cursor: 'default' }}>
            <div className="bg-[#1e2329] p-6 rounded-lg shadow-xl border border-[#2b3139] w-80">
                <h3 className="text-[#eaecef] text-lg font-bold mb-4 flex items-center gap-2">
                    <Edit3 size={18} /> 編輯圖形樣式
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-[#848e9c] block mb-2">顏色</label>
                        <div className="flex gap-2">
                            {['#2962FF', '#F23645', '#089981', '#f0b90b', '#eaecef'].map(c => (
                                <div 
                                    key={c} 
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-[#848e9c] block mb-2">線條粗細: {width}px</label>
                        <input type="range" min="1" max="10" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full accent-[#f0b90b]"/>
                    </div>

                    <div>
                        <label className="text-xs text-[#848e9c] block mb-2">線條樣式</label>
                        <select value={lineStyle} onChange={e => setLineStyle(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white outline-none">
                            <option value="SOLID">實線 (Solid)</option>
                            <option value="DASHED">虛線 (Dashed)</option>
                            <option value="DOTTED">點線 (Dotted)</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={() => { onDelete(); onClose(); }} className="flex-1 py-2 bg-[#F23645]/20 text-[#F23645] rounded hover:bg-[#F23645]/30">刪除</button>
                    <button onClick={onClose} className="flex-1 py-2 bg-[#2b3139] text-[#eaecef] rounded hover:bg-[#373d45]">取消</button>
                    <button onClick={() => { onSave({ ...shape, color, width, lineStyle }); onClose(); }} className="flex-1 py-2 bg-[#f0b90b] text-black font-bold rounded hover:bg-[#d9a506]">保存</button>
                </div>
            </div>
        </div>
    );
};

export default ShapeSettingsModal;