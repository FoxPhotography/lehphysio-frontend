import React from 'react';
import { UserAvatar } from '../components/UserAvatar';

interface LeaderboardProps {
  user: any;
  leaderboard: any[];
  leaderboardTab: string;
  setLeaderboardTab: (tab: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  leaderboard,
  leaderboardTab,
  setLeaderboardTab
}) => {
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

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
      <section className="leaderboard-podium glass-card" style={{ marginBottom: '2rem' }}>
        {/* 2nd place */}
        <div className="podium-column" style={{ opacity: second ? 1 : 0.4 }}>
          <div className="podium-avatar-container">
            <UserAvatar 
              username={second ? second.username : '—'} 
              avatarUrl={second ? second.avatar_url : null} 
              equippedFrame={second ? second.equipped_frame : 'none'} 
              size={54} 
            />
            <span className="podium-rank-badge">2</span>
          </div>
          <span className="podium-username">{second ? second.username : '—'}</span>
          <span className="podium-xp">{second ? `${second.xp} XP` : '0 XP'}</span>
          <div className="podium-bar second">2</div>
        </div>

        {/* 1st place */}
        <div className="podium-column" style={{ opacity: first ? 1 : 0.4 }}>
          <div className="podium-avatar-container">
            <UserAvatar 
              username={first ? first.username : '—'} 
              avatarUrl={first ? first.avatar_url : null} 
              equippedFrame={first ? first.equipped_frame : 'none'} 
              size={64} 
            />
            <span className="podium-rank-badge">1</span>
          </div>
          <span className="podium-username">{first ? first.username : '—'}</span>
          <span className="podium-xp">{first ? `${first.xp} XP` : '0 XP'}</span>
          <div className="podium-bar first">1</div>
        </div>

        {/* 3rd place */}
        <div className="podium-column" style={{ opacity: third ? 1 : 0.4 }}>
          <div className="podium-avatar-container">
            <UserAvatar 
              username={third ? third.username : '—'} 
              avatarUrl={third ? third.avatar_url : null} 
              equippedFrame={third ? third.equipped_frame : 'none'} 
              size={50} 
            />
            <span className="podium-rank-badge">3</span>
          </div>
          <span className="podium-username">{third ? third.username : '—'}</span>
          <span className="podium-xp">{third ? `${third.xp} XP` : '0 XP'}</span>
          <div className="podium-bar third">3</div>
        </div>
      </section>

      {/* Podium filter list */}
      <div className="leaderboard-list-container">
        {leaderboard.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No users ranked in this tab yet.</p>
        ) : (
          leaderboard.map((u: any) => {
            const isMe = user && u.username === user.username;
            return (
              <div key={u.username} className={`leaderboard-row-item ${isMe ? 'my-row' : ''}`}>
                <span className="row-rank-num">{u.rank_num}</span>
                <UserAvatar 
                  username={u.username} 
                  avatarUrl={u.avatar_url} 
                  equippedFrame={u.equipped_frame} 
                  size={32}
                  style={{ marginLeft: '12px' }}
                />
                <div className="row-info">
                  <div className="row-name">{u.username}</div>
                  <div className="row-sub">{u.batch} · {u.rank.emoji} {u.rank.name_en}</div>
                </div>
                <span className="row-xp-badge">{u.xp} XP</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
