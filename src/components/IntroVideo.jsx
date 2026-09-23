import React, { useState, useEffect } from 'react';

export default function IntroVideo() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only play once per session
    const played = sessionStorage.getItem('introPlayed');
    if (!played) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('introPlayed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <video
        src="/intro_cropped.mp4"
        autoPlay
        playsInline
        onEnded={handleClose}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
      <button 
        onClick={handleClose}
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          padding: '12px 28px',
          background: 'rgba(20, 20, 20, 0.6)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(40, 40, 40, 0.8)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        Skip Intro
      </button>
    </div>
  );
}
