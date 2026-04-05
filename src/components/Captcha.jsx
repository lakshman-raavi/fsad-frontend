import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw } from 'lucide-react';

const Captcha = forwardRef(({ theme = 'default' }, ref) => {
    const [captcha, setCaptcha] = useState('');
    const [userInput, setUserInput] = useState('');

    const generateCaptcha = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
        setUserInput('');
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const isValid = userInput.toLowerCase() === captcha.toLowerCase();
            generateCaptcha(); // Always reset to prevent reuse
            return isValid;
        },
        refresh: generateCaptcha
    }), [userInput, captcha]);

    const isSaas = theme === 'saas' || theme === 'light-saas';
    const isLight = theme === 'light-saas';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isSaas && <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#475569' : 'rgba(255,255,255,0.6)', marginLeft: '4px' }}>Verification Code</label>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                    className="captcha-display"
                    style={{
                        padding: isSaas ? '0.5rem 1rem' : '0.6rem 1.2rem',
                        background: isLight ? '#f8fafc' : (isSaas ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'),
                        borderRadius: isSaas ? '12px' : 12,
                        fontSize: isSaas ? '1.8rem' : '2rem',
                        letterSpacing: '1px',
                        userSelect: 'none',
                        border: isLight ? '1.5px solid #e2e8f0' : (isSaas ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255, 255, 255, 0.1)'),
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isSaas ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '160px',
                        minHeight: '60px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {captcha.split('').map((char, index) => {
                        const charCode = char.charCodeAt(0) + index * 10;
                        const rot = (charCode % 24) - 12; // -12 to 12 degrees
                        const y = (charCode % 10) - 5; // -5 to 5 px
                        const scale = 1 + ((charCode % 20) / 100); // 1.0 to 1.2
                        
                        return (
                            <span key={index} style={{
                                display: 'inline-block',
                                transform: `rotate(${rot}deg) translateY(${y}px) scale(${scale})`,
                                color: '#f74174', // Match the bubbly pink color
                                fontFamily: "'Fredoka One', 'Bubblegum Sans', cursive",
                                padding: '0 2px',
                                textShadow: '1px 1px 0px rgba(0,0,0,0.05)'
                            }}>
                                {char}
                            </span>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={generateCaptcha}
                    style={{
                        background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                        border: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                        padding: '0.6rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: isLight ? '#64748b' : 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                    title="Refresh CAPTCHA"
                    className="captcha-refresh-btn"
                >
                    <RefreshCw size={18} />
                </button>
            </div>
            <input
                type="text"
                placeholder="Type the code above"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isLight ? '#ffffff' : (isSaas ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.06)'),
                    border: isLight ? '1.5px solid #e2e8f0' : (isSaas ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.15)'),
                    borderRadius: '12px',
                    color: isLight ? '#1e293b' : 'white',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
            />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
                .captcha-refresh-btn:hover {
                    border-color: #f74174 !important;
                    color: #f74174 !important;
                }
            `}</style>
        </div>
    );
});

export default Captcha;
