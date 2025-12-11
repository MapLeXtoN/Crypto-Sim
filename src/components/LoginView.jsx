import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase'; 
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LoginView = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const initUserInDB = async (user) => {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                balance: 100000,
                positions: [],
                orders: [],
                history: []
            });
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            let result;
            if (isRegistering) {
                result = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                result = await signInWithEmailAndPassword(auth, email, password);
            }
            await initUserInDB(result.user);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await initUserInDB(result.user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0b0e11] text-[#eaecef]">
            <div className="bg-[#1e2329] p-8 rounded-lg shadow-2xl w-full max-w-md border border-[#2b3139]">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#f0b90b] mb-2">
                        CryptoSim {isRegistering ? '註冊' : '登入'}
                    </h2>
                    <p className="text-[#848e9c] text-sm">
                        {isRegistering ? '創建您的模擬交易帳戶' : '歡迎回到模擬交易系統'}
                    </p>
                </div>
                {error && <div className="bg-[#F23645]/10 border border-[#F23645] text-[#F23645] p-3 rounded mb-4 text-sm text-center">{error}</div>}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs text-[#848e9c] mb-1">電子郵件</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white focus:border-[#f0b90b] outline-none" placeholder="name@example.com"/>
                    </div>
                    <div>
                        <label className="block text-xs text-[#848e9c] mb-1">密碼</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#2b3139] border border-[#474d57] rounded p-2 text-white focus:border-[#f0b90b] outline-none" placeholder="••••••••"/>
                    </div>
                    <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a506] text-black font-bold py-2 rounded transition-colors">{isRegistering ? '註冊帳戶' : '立即登入'}</button>
                </form>
                <div className="flex items-center my-4"><div className="flex-grow border-t border-[#2b3139]"></div><span className="px-3 text-xs text-[#848e9c]">OR</span><div className="flex-grow border-t border-[#2b3139]"></div></div>
                <button onClick={handleGoogleAuth} className="w-full bg-[#eaecef] hover:bg-white text-black font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                   <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>Google 登入
                </button>
                <div className="mt-6 text-center text-sm text-[#848e9c]">
                    {isRegistering ? '已經有帳號了？' : '還沒有帳號？'}
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#f0b90b] hover:underline ml-1 font-bold">{isRegistering ? '去登入' : '去註冊'}</button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;