import { useState, useEffect } from 'react';

export default function CodeIntro() {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState('');
  
  const fullText = `> INIT STRATA OS v9.2.1\n> CONNECTING TO SECURE MESH...\n> BYPASSING FIREWALL...\n> ACCESS GRANTED.`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setTimeout(() => setVisible(false), 800);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullText]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020205', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#22d3ee', fontFamily: 'monospace', fontSize: 24,
      whiteSpace: 'pre-wrap', padding: 40,
      textShadow: '0 0 10px #22d3ee'
    }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {text}
        <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
      </div>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
