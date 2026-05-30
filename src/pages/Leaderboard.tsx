import React from 'react';

interface LeaderboardProps {
  user: any;
  leaderboard: any[];
  leaderboardTab: string;
  setLeaderboardTab: (tab: string) => void;
}

const getFrameClass = (frame: string) => {
  if (frame === 'gold-glow') return 'avatar-frame-gold-glow';
  if (frame === 'neon-ring') return 'avatar-frame-neon-ring';
  return '';
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  leaderboard,
  leaderboardTab,
  setLeaderboardTab
}) => {
  return (
    <div className="leaderboard-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-trophy"></i> Leh Physio? Leaderboard</span>
      </div>
      
      {/* Toggle tabs */}
      <section className="games-filter-tabs">
        <button className={`games-filter-btn ${leaderboardTab === 'all-time' ? 'active' : ''}`} onClick={() => setLeaderboardTab('all-time')}>All-Time</button>
        <button className={`games-filter-btn ${leaderboardTab === 'weekly' ? 'active' : ''}`} onClick={() => setLeaderboardTab('weekly')}>Weekly</button>
        {user && (
          <button className={`games-filter-btn ${leaderboardTab === 'batch' ? 'active' : ''}`} onClick={() => setLeaderboardTab('batch')}>My Batch ({user.batch})</button>
        )}
      </section>

      {/* Visual Podium Top 3 */}
      {leaderboard.length >= 3 && (
        <section className="leaderboard-podium glass-card" style={{ marginBottom: '2rem' }}>
          {/* 2nd place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className={`podium-avatar-ring second ${getFrameClass((leaderboard[1] as any).equipped_frame)}`} style={{ position: 'relative' }}>
                <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(leaderboard[1] as any).avatar_url ? (
                    <img src={(leaderboard[1] as any).avatar_url} alt={(leaderboard[1] as any).username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (leaderboard[1] as any).username.substring(0,2).toUpperCase()
                  )}
                </div>
              </div>
              <span className="podium-rank-badge">2</span>
            </div>
            <span className="podium-username">{(leaderboard[1] as any).username}</span>
            <span className="podium-xp">{(leaderboard[1] as any).xp} XP</span>
            <div className="podium-bar second">2</div>
          </div>
          {/* 1st place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className={`podium-avatar-ring first ${getFrameClass((leaderboard[0] as any).equipped_frame)}`} style={{ position: 'relative' }}>
                <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(leaderboard[0] as any).avatar_url ? (
                    <img src={(leaderboard[0] as any).avatar_url} alt={(leaderboard[0] as any).username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (leaderboard[0] as any).username.substring(0,2).toUpperCase()
                  )}
                </div>
              </div>
              <span className="podium-rank-badge">1</span>
            </div>
            <span className="podium-username">{(leaderboard[0] as any).username}</span>
            <span className="podium-xp">{(leaderboard[0] as any).xp} XP</span>
            <div className="podium-bar first">1</div>
          </div>
          {/* 3rd place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className={`podium-avatar-ring third ${getFrameClass((leaderboard[2] as any).equipped_frame)}`} style={{ position: 'relative' }}>
                <div className="podium-avatar-inner" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(leaderboard[2] as any).avatar_url ? (
                    <img src={(leaderboard[2] as any).avatar_url} alt={(leaderboard[2] as any).username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (leaderboard[2] as any).username.substring(0,2).toUpperCase()
                  )}
                </div>
              </div>
              <span className="podium-rank-badge">3</span>
            </div>
            <span className="podium-username">{(leaderboard[2] as any).username}</span>
            <span className="podium-xp">{(leaderboard[2] as any).xp} XP</span>
            <div className="podium-bar third">3</div>
          </div>
        </section>
      )}

      {/* Podium filter list */}
      <div className="leaderboard-list-container">
        {leaderboard.map((u: any) => {
          const isMe = user && u.username === user.username;
          return (
            <div key={u.username} className={`leaderboard-row-item ${isMe ? 'my-row' : ''}`}>
              <span className="row-rank-num">{u.rank_num}</span>
              <div className={`mobile-avatar-ring ${getFrameClass(u.equipped_frame)}`} style={{ width: '32px', height: '32px', flexShrink: 0, marginLeft: '12px', cursor: 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                <div className="mobile-avatar-inner" style={{ fontSize: '11px', background: 'var(--bg-secondary)' }}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    u.username.substring(0,2).toUpperCase()
                  )}
                </div>
              </div>
              <div className="row-info">
                <div className="row-name">{u.username}</div>
                <div className="row-sub">{u.batch} · {u.rank.emoji} {u.rank.name_en}</div>
              </div>
              <span className="row-xp-badge">{u.xp} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
