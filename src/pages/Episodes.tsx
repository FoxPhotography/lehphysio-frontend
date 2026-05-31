import React from 'react';

interface EpisodesProps {
  episodes: any[];
  navigateToEpisode: (id: number) => void;
  handleLikeEpisode: (id: number) => void;
  handleShareEpisode: (id: number) => void;
  user: any;
}

export const Episodes: React.FC<EpisodesProps> = ({
  episodes,
  navigateToEpisode,
  handleLikeEpisode,
  handleShareEpisode,
  user
}) => {
  return (
    <div className="episodes-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-video"></i> Podcast Episodes</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '14px' }}>
        Watch the episodes to find the hidden secret code and solve the quiz to get +250 XP total per episode!
      </p>
      
      <div className="game-card-grid">
        {episodes.map((ep: any) => (
          <div key={ep.id} className="game-widget-card glass-card" onClick={() => navigateToEpisode(ep.id)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div className="continue-thumb" style={{ backgroundImage: `url(${ep.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})`, borderRadius: '12px' }}>
              <span className="game-tag-badge" style={{ position: 'absolute', top: '10px', right: '10px' }}>Episode {ep.id}</span>
            </div>
            <h3 className="game-card-title" style={{ marginTop: '0.5rem', flexGrow: 1 }}>{ep.title_ar}</h3>
            <p className="game-card-desc">{ep.description}</p>
            <div className="game-card-footer" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="game-card-reward">🔑 Secret Code + Quiz</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {new Date(ep.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>

            {/* Social action feedback row */}
            <div className="episode-card-social-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', alignItems: 'center' }}>
              <button 
                className={`feed-action-btn ${ep.isLiked ? 'liked' : ''}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: ep.isLiked ? 'var(--orange)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 800
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeEpisode(ep.id);
                }}
              >
                <i className={ep.isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'}></i> {ep.likes_count || 0}
              </button>

              <button 
                className="feed-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 800
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToEpisode(ep.id);
                  setTimeout(() => {
                    const inp = document.getElementById('episode-comment-input');
                    if (inp) inp.focus();
                  }, 150);
                }}
              >
                <i className="ti ti-message-circle"></i> {ep.comments_count || 0}
              </button>

              <button 
                className="feed-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 800
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareEpisode(ep.id);
                }}
              >
                <i className="ti ti-share"></i> {ep.shares_count || 0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
