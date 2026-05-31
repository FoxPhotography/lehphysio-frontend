import React, { useState, useEffect } from 'react';
import { playChatSound, setFramesCache } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

interface RewardsProps {
  user: any;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: any) => void;
  secretCode: string;
  setSecretCode: (val: string) => void;
  showToast: (msg: string) => void;
  triggerXpPopup: (amount: number) => void;
  claimMockReward: (amount: number) => void;
  unlockedCosmetics: string[];
  handleShopPurchase: (itemId: string, cost: number) => void;
  hasOpenedBoxToday: boolean;
  handleClaimSurpriseBox: () => void;
  handleBuyFrame?: (frameId: string, price: number) => Promise<boolean>;
}

export const Rewards: React.FC<RewardsProps> = ({
  user,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  showToast,
  triggerXpPopup,
  claimMockReward,
  unlockedCosmetics,
  handleShopPurchase,
  hasOpenedBoxToday,
  handleClaimSurpriseBox,
  handleBuyFrame
}) => {
  const [shopFrames, setShopFrames] = useState<any[]>([]);
  const [buyingFrameId, setBuyingFrameId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/frames`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShopFrames(data);
          setFramesCache(data);
        }
      })
      .catch(() => {});
  }, []);

  const isFrameOwned = (frameId: number) => {
    return user?.unlocked_frames?.includes(frameId) || false;
  };

  const handleFrameBuy = async (frameId: string) => {
    if (buyingFrameId) return;
    setBuyingFrameId(frameId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/frames/buy/${frameId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Frame purchased!');
        if (handleBuyFrame) await handleBuyFrame(frameId, 0);
      } else {
        showToast(data.error || 'Failed to purchase frame.');
      }
    } catch (e) {
      showToast('An error occurred.');
    }
    setBuyingFrameId(null);
  };
  return (
    <div className="rewards-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-building-store"></i> XP Shop & Reward Center</span>
      </div>

      <section className="stats-badge-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Secret Code Input */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🔑 Redeem Secret XP Code</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter codes from social media or episodes to get instant points.</p>
          {redeemError && <div className="pl-form-error">{redeemError}</div>}
          {redeemSuccess && <div className="pl-form-success">{redeemSuccess}</div>}
          <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="pl-input"
              placeholder="Enter reward code here"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Redeem Code</button>
          </form>
        </div>

        {/* Daily chest rewards box */}
        <div className="glass-card mystery-chest-panel" style={{ opacity: hasOpenedBoxToday ? 0.7 : 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>📦 Daily Surprise Box</h3>
          <div 
            className={`chest-box-visual ${hasOpenedBoxToday ? 'opened' : ''}`} 
            onClick={hasOpenedBoxToday ? undefined : handleClaimSurpriseBox}
            style={{ 
              cursor: hasOpenedBoxToday ? 'not-allowed' : 'pointer', 
              fontSize: '48px', 
              textAlign: 'center', 
              margin: '1rem 0',
              filter: hasOpenedBoxToday ? 'grayscale(0.6)' : 'none'
            }}
          >
            {hasOpenedBoxToday ? '🔓' : '📦'}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {hasOpenedBoxToday ? 'You have already opened your surprise box today. Resets at 12:00 AM.' : 'Click the box to open it and receive a random daily bonus!'}
          </p>
        </div>
      </section>

      {/* XP Shop Grid */}
      <section style={{ marginTop: '2.5rem' }}>
        <h3 className="pl-section-h2"><span className="title-text"><i className="ti ti-shopping-cart"></i> Cosmetics Shop (XP Shop)</span></h3>
        <div className="rewards-shop-grid">
          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box avatar-frame-gold-glow">🌟</div>
            <h4 className="shop-item-title">Golden Glowing Frame</h4>
            <span className="shop-item-cost">500 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('gold-glow', 500)}
              disabled={unlockedCosmetics.includes('gold-glow')}
            >
              {unlockedCosmetics.includes('gold-glow') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box avatar-frame-neon-ring">🩵</div>
            <h4 className="shop-item-title">Neon Blue Ring</h4>
            <span className="shop-item-cost">800 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('neon-ring', 800)}
              disabled={unlockedCosmetics.includes('neon-ring')}
            >
              {unlockedCosmetics.includes('neon-ring') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box">🧠</div>
            <h4 className="shop-item-title">Title: "Neuro Specialist"</h4>
            <span className="shop-item-cost">1,500 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('neuro-specialist', 1500)}
              disabled={unlockedCosmetics.includes('neuro-specialist')}
            >
              {unlockedCosmetics.includes('neuro-specialist') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box">👑</div>
            <h4 className="shop-item-title">Title: "Diagnosis Legend"</h4>
            <span className="shop-item-cost">2,000 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('diagnosis-legend', 2000)}
              disabled={unlockedCosmetics.includes('diagnosis-legend')}
            >
              {unlockedCosmetics.includes('diagnosis-legend') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          {/* Dynamic frame shop items */}
          {shopFrames.map((f: any) => {
            const owned = isFrameOwned(f._id);
            const canAfford = user && user.total_xp >= f.price;
            return (
              <div key={f._id} className="shop-item-card glass-card">
                <div className="shop-item-preview-box" style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '50%' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,106,0,0.12)' }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--orange)' }}>A</span>
                    <img src={f.image_url} alt={f.name} style={{ position: 'absolute', top: '-7.5%', left: '-7.5%', width: '115%', height: '115%', objectFit: 'fill', pointerEvents: 'none' }} />
                  </div>
                </div>
                <h4 className="shop-item-title">{f.name}</h4>
                <span className="shop-item-cost">{f.price.toLocaleString()} XP</span>
                <button
                  className={`btn-primary mini ${buyingFrameId === String(f._id) ? 'loading' : ''}`}
                  onClick={() => handleFrameBuy(String(f._id))}
                  disabled={owned || buyingFrameId !== null}
                >
                  {buyingFrameId === String(f._id) ? 'Buying...' : owned ? 'Owned' : canAfford ? 'Buy' : 'Not enough XP'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
