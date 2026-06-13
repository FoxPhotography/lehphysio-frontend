import React from 'react';
import { Home } from '../pages/Home';
import { News } from '../pages/News';
import { Episodes } from '../pages/Episodes';
import { EpisodeDetail } from '../pages/EpisodeDetail';
import { Community } from '../pages/Community';
import { Games } from '../pages/Games';
import { PlayGame } from '../pages/PlayGame';
import { Leaderboard } from '../pages/Leaderboard';
import { Profile } from '../pages/Profile';
import { Rewards } from '../pages/Rewards';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Confirm } from '../pages/Confirm';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { Admin } from '../pages/Admin';
import { ModeratorDashboard } from '../pages/ModeratorDashboard';
import { useAuth } from '../context/AuthContext';
import { getLocalDateString } from '../utils/helpers';

interface AppRouterProps {
  // Page states and methods not in AuthContext
  loginReward: any;
  dailyQuestion?: any;
  handleAnswerQuestion?: (questionId: number, selectedAnswer: number) => Promise<void>;
  newPostContent: string;
  setNewPostContent: (content: string) => void;
  handleCreatePost: (title: string, content: string, imageUrl: string, isNews?: boolean) => Promise<void>;
  handleEditPost: (id: number, content: string, imageUrl: string, title?: string | null) => Promise<void>;
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleCancelPostRevision: (id: number) => void;
  communityPosts: any[];
  episodes: any[];
  handleLikeEpisode: (id: number) => Promise<void>;
  handleShareEpisode: (id: number) => void;
  navigateToEpisode: (id: number) => void;
  
  // Episode Details
  episodeDetailLoading: boolean;
  episodeDetail: any;
  episodeInteracting: boolean;
  handleEpisodeInteract: (type: string, content?: string, parentId?: number) => Promise<void>;
  handleQuizSubmit: (quizId: number) => Promise<void>;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: any) => Promise<void>;
  secretCode: string;
  setSecretCode: React.Dispatch<React.SetStateAction<string>>;
  quizResult: any;
  setQuizResult: React.Dispatch<React.SetStateAction<any>>;
  quizAnswer: number | null;
  setQuizAnswer: React.Dispatch<React.SetStateAction<number | null>>;
  commentInput: string;
  setCommentInput: React.Dispatch<React.SetStateAction<string>>;
  replyingToComment: any;
  setReplyingToComment: React.Dispatch<React.SetStateAction<any>>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  handleEditComment: (commentId: number, content: string) => Promise<void>;
  
  // Chat / Community Page specific hook bindings
  chatHook: any;
  suggestions: any[];
  handleCreateSuggestion: (title: string, content: string) => Promise<void>;
  handleUpvoteSuggestion: (id: number) => Promise<void>;
  handleDeleteSuggestion: (id: number) => void;
  handleEditSuggestion: (id: number, title: string, content: string) => Promise<void>;
  handleCancelSuggestionRevision: (id: number) => Promise<void>;
  handleOpenModerationModal: (username: string, userId: number) => void;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;

  // Games page specific hook bindings
  gamesHook: any;
  newsPosts: any[];
  isLoadingOlderPosts: boolean;
  hasMorePosts: boolean;
  fetchCommunityPosts: (beforeId?: string) => Promise<void>;
  isRefreshingFeed: boolean;

  // Leaderboard tab
  leaderboard: any[];
  leaderboardTab: string;
  setLeaderboardTab: React.Dispatch<React.SetStateAction<string>>;

  // Shop / Rewards
  handleShopPurchase: (item: any) => Promise<boolean>;
  handleClaimSurpriseBox: () => Promise<void>;
  handleBuyFrame: () => Promise<boolean>;

  // Login/Register forms and errors
  loginForm: any;
  setLoginForm: React.Dispatch<React.SetStateAction<any>>;
  authError: string;
  handleLogin: (e: any) => Promise<void>;
  registerForm: any;
  setRegisterForm: React.Dispatch<React.SetStateAction<any>>;
  authSuccess: string;
  handleRegister: (e: any) => Promise<void>;
  confirmCode: string;
  setConfirmCode: React.Dispatch<React.SetStateAction<string>>;
  handleConfirm: (e: any) => Promise<void>;
  handleForgotPassword: (email: string) => Promise<void>;
  handleResetPassword: (code: string, pass: string) => Promise<void>;

  // Admin section
  adminSection: string;
  setAdminSection: React.Dispatch<React.SetStateAction<string>>;
  adminMessage: string;
  setAdminMessage: React.Dispatch<React.SetStateAction<string>>;
  adminEpisodeForm: any;
  setAdminEpisodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateEpisode: (e: React.FormEvent) => Promise<void>;
  adminSubmitting: boolean;
  setAdminSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  adminUsers: any[];
  adminCodes: any[];
  adminSuggestions: any[];
  adminCodeForm: any;
  setAdminCodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateCode: (e: React.FormEvent) => Promise<void>;
  handleAdminUpdateUserRole: (userId: number, role: string) => Promise<void>;
  handleAdminUpdateSuggestionStatus: (suggestionId: number, status: 'approved' | 'rejected', action?: string, reason?: string) => Promise<void>;
  handleAdminDeleteCode: (codeId: number, name: string) => void;
  handleAdminDeleteUser: (userId: number, username: string) => void;
  apiBase: string;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  loginReward,
  dailyQuestion,
  handleAnswerQuestion,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  handleEditPost,
  communityPosts,
  handleLikePost,
  handleDeletePost,
  handleCancelPostRevision,
  episodes,
  handleLikeEpisode,
  handleShareEpisode,
  navigateToEpisode,

  episodeDetailLoading,
  episodeDetail,
  episodeInteracting,
  handleEpisodeInteract,
  handleQuizSubmit,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  quizResult,
  setQuizResult,
  quizAnswer,
  setQuizAnswer,
  commentInput,
  setCommentInput,
  replyingToComment,
  setReplyingToComment,
  handleDeleteComment,
  handleEditComment,

  chatHook,
  suggestions,
  handleCreateSuggestion,
  handleUpvoteSuggestion,
  handleDeleteSuggestion,
  handleEditSuggestion,
  handleCancelSuggestionRevision,
  handleOpenModerationModal,

  gamesHook,
  newsPosts,
  isLoadingOlderPosts,
  hasMorePosts,
  fetchCommunityPosts,
  isRefreshingFeed,

  leaderboard,
  leaderboardTab,
  setLeaderboardTab,

  handleShopPurchase,
  handleClaimSurpriseBox,
  handleBuyFrame,

  loginForm,
  setLoginForm,
  authError,
  handleLogin,
  registerForm,
  setRegisterForm,
  authSuccess,
  handleRegister,
  confirmCode,
  setConfirmCode,
  handleConfirm,
  handleForgotPassword,
  handleResetPassword,

  adminSection,
  setAdminSection,
  adminMessage,
  setAdminMessage,
  adminEpisodeForm,
  setAdminEpisodeForm,
  handleAdminCreateEpisode,
  adminSubmitting,
  setAdminSubmitting,
  adminUsers,
  adminCodes,
  adminSuggestions,
  adminCodeForm,
  setAdminCodeForm,
  handleAdminCreateCode,
  handleAdminUpdateUserRole,
  handleAdminUpdateSuggestionStatus,
  handleAdminDeleteCode,
  handleAdminDeleteUser,
  apiBase,
  handleOpenReportModal
}) => {
  const { currentPage, user, token, forgotEmail, equippedFrame, setEquippedFrame, equippedTitle, setEquippedTitle, unlockedCosmetics, setCurrentPage, handleLogout, handleUpdateProfile, handleUploadImage, isSubscribed, pushLoading, handleTogglePushNotifications, showToast, triggerXpPopup, xpSettings, fetchUserProfile, getAvatarFrameClass, showConfirm, usernamesDirectory, confirmEmail } = useAuth();

  switch (currentPage) {
    case 'home':
      return (
        <Home
          user={user}
          loginReward={loginReward}
          navigateToEpisode={navigateToEpisode}
          setCurrentPage={setCurrentPage}
          setCommunityTab={chatHook.setCommunityTab || (() => {})}
          dailyQuestion={dailyQuestion}
          handleAnswerQuestion={handleAnswerQuestion}
          newPostContent={newPostContent}
          setNewPostContent={setNewPostContent}
          handleCreatePost={handleCreatePost}
          handleEditPost={handleEditPost}
          communityPosts={communityPosts}
          handleLikePost={handleLikePost}
          handleDeletePost={handleDeletePost}
          handleCancelPostRevision={handleCancelPostRevision}
          handleSharePost={(id) => showToast('Post link copied to clipboard! 🔗')}
          handleUploadImage={handleUploadImage}
          usernames={usernamesDirectory}
          showToast={showToast}
          equippedFrame={equippedFrame}
          leaderboard={leaderboard}
          episodes={episodes}
          triggerXpPopup={triggerXpPopup}
          xpSettings={xpSettings}
          newsPosts={newsPosts}
          loadOlderPosts={fetchCommunityPosts}
          isLoadingOlderPosts={isLoadingOlderPosts}
          hasMorePosts={hasMorePosts}
          isRefreshingFeed={isRefreshingFeed}
          handleOpenReportModal={handleOpenReportModal}
        />
      );
    case 'news':
      return (
        <News
          user={user}
          newsPosts={newsPosts}
          handleLikePost={handleLikePost}
          handleDeletePost={handleDeletePost}
          handleSharePost={(id) => showToast('Post link copied to clipboard! 🔗')}
          handleUploadImage={handleUploadImage}
          handleEditPost={handleEditPost}
          setCurrentPage={setCurrentPage}
          showToast={showToast}
          equippedFrame={equippedFrame}
        />
      );
    case 'episodes':
      return (
        <Episodes
          episodes={episodes}
          navigateToEpisode={(id) => {
            setQuizAnswer(null);
            setQuizResult(null);
            navigateToEpisode(id);
          }}
          handleLikeEpisode={handleLikeEpisode}
          handleShareEpisode={handleShareEpisode}
          user={user}
        />
      );
    case 'episode-detail':
      return (
        <EpisodeDetail
          episodeDetailLoading={episodeDetailLoading}
          episodeDetail={episodeDetail}
          episodeInteracting={episodeInteracting}
          user={user}
          setCurrentPage={setCurrentPage}
          handleEpisodeInteract={handleEpisodeInteract}
          handleQuizSubmit={handleQuizSubmit}
          redeemError={redeemError}
          redeemSuccess={redeemSuccess}
          handleRedeem={handleRedeem}
          secretCode={secretCode}
          setSecretCode={setSecretCode}
          quizResult={quizResult}
          setQuizResult={setQuizResult}
          quizAnswer={quizAnswer}
          setQuizAnswer={setQuizAnswer}
          commentInput={commentInput}
          setCommentInput={setCommentInput}
          replyingToComment={replyingToComment}
          setReplyingToComment={setReplyingToComment}
          handleOpenModerationModal={handleOpenModerationModal}
          handleDeleteComment={handleDeleteComment}
          handleEditComment={handleEditComment}
          usernames={usernamesDirectory}
          showToast={showToast}
          handleOpenReportModal={handleOpenReportModal}
        />
      );
    case 'community':
      return (
        <Community
          user={user}
          onlineCount={chatHook.onlineCount}
          chatMessages={chatHook.chatMessages}
          isFindingTargetMessage={chatHook.isFindingTargetMessage}
          isMultiSelectMode={chatHook.isMultiSelectMode}
          setIsMultiSelectMode={chatHook.setIsMultiSelectMode}
          selectedMessageIds={chatHook.selectedMessageIds}
          setSelectedMessageIds={chatHook.setSelectedMessageIds}
          swipeTranslateX={chatHook.swipeTranslateX}
          swipeMessageIdRef={{ current: null }}
          replyingTo={chatHook.replyingTo}
          setReplyingTo={chatHook.setReplyingTo}
          editingMessage={chatHook.editingMessage}
          setEditingMessage={chatHook.setEditingMessage}
          chatInput={chatHook.chatInput}
          setChatInput={chatHook.setChatInput}
          handleSendChatMessage={chatHook.handleSendChatMessage}
          setCurrentPage={setCurrentPage}
          activeContextMenu={chatHook.activeContextMenu}
          setActiveContextMenu={chatHook.setActiveContextMenu}
          handleChatContextMenu={chatHook.handleChatContextMenu}
          handleChatTouchStart={chatHook.handleChatTouchStart}
          handleChatTouchMove={chatHook.handleChatTouchMove}
          handleChatTouchEnd={chatHook.handleChatTouchEnd}
          handleToggleReaction={chatHook.handleToggleReaction}
          handleDeleteMessage={chatHook.handleDeleteMessage}
          handleBulkDeleteMessages={chatHook.handleBulkDeleteMessages}
          suggestions={suggestions}
          handleCreateSuggestion={handleCreateSuggestion}
          handleUpvoteSuggestion={handleUpvoteSuggestion}
          handleOpenModerationModal={handleOpenModerationModal}
          handleDeleteSuggestion={handleDeleteSuggestion}
          handleEditSuggestion={handleEditSuggestion}
          handleCancelSuggestionRevision={handleCancelSuggestionRevision}
          usernames={usernamesDirectory}
          getAvatarFrameClass={getAvatarFrameClass}
          equippedFrame={equippedFrame}
          loadOlderMessages={chatHook.fetchChatMessages}
          isLoadingOlder={chatHook.isLoadingOlderChat}
          hasMoreChat={chatHook.hasMoreChat}
          isRefreshingChat={chatHook.isRefreshingChat}
          handleOpenReportModal={handleOpenReportModal}
        />
      );
    case 'games':
      return (
        <Games
          user={user}
          gameTab={gamesHook.gameTab}
          setGameTab={gamesHook.setGameTab}
          activeGame={gamesHook.activeGame}
          setActiveGame={gamesHook.setActiveGame}
          gameFinished={gamesHook.gameFinished}
          setGameFinished={gamesHook.setGameFinished}
          memoryMoves={gamesHook.memoryMoves}
          memoryMatches={gamesHook.memoryMatches}
          gamePlaySuccess={gamesHook.gamePlaySuccess}
          gamePlayError={gamesHook.gamePlayError}
          initMemoryGame={gamesHook.initMemoryGame}
          memoryCards={gamesHook.memoryCards}
          handleCardClick={gamesHook.handleCardClick}
          wheelRotation={gamesHook.wheelRotation}
          handleSpinWheelClick={gamesHook.handleSpinWheelClick}
          isSpinning={gamesHook.isSpinning}
          gameError={gamesHook.gameError}
          createGameRounds={gamesHook.createGameRounds}
          setCreateGameRounds={gamesHook.setCreateGameRounds}
          createGameDuration={gamesHook.createGameDuration}
          setCreateGameDuration={gamesHook.setCreateGameDuration}
          handleCreateGameRoom={gamesHook.handleCreateGameRoom}
          gameRoomCodeInput={gamesHook.gameRoomCodeInput}
          setGameRoomCodeInput={gamesHook.setGameRoomCodeInput}
          handleJoinGameRoom={gamesHook.handleJoinGameRoom}
          isGameLoading={gamesHook.isGameLoading}
          hasSpunToday={!!(user && user.last_spin_wheel_date === getLocalDateString())}
          xpSettings={xpSettings}
        />
      );
    case 'play-game':
      return (
        <PlayGame
          activeGameRoom={gamesHook.activeGameRoom}
          user={user}
          handleLeaveGameRoom={gamesHook.handleLeaveGameRoom}
          handleStartGame={gamesHook.handleStartGame}
          handleSubmitGameAnswer={gamesHook.handleSubmitGameAnswer}
          submittedGameAnswer={gamesHook.submittedGameAnswer}
          setSubmittedGameAnswer={gamesHook.setSubmittedGameAnswer}
          handleNextRound={gamesHook.handleNextRound}
          handlePlayAgain={gamesHook.handlePlayAgain}
          showToast={showToast}
          token={token}
          apiBase={apiBase}
          setActiveGameRoom={gamesHook.setActiveGameRoom}
        />
      );
    case 'leaderboard':
      return (
        <Leaderboard
          user={user}
          leaderboard={leaderboard}
          leaderboardTab={leaderboardTab}
          setLeaderboardTab={setLeaderboardTab}
        />
      );
    case 'profile':
      return (
        <Profile
          user={user}
          equippedFrame={equippedFrame}
          setEquippedFrame={setEquippedFrame}
          equippedTitle={equippedTitle}
          setEquippedTitle={setEquippedTitle}
          unlockedCosmetics={unlockedCosmetics}
          setCurrentPage={setCurrentPage}
          handleLogout={handleLogout}
          handleUpdateProfile={handleUpdateProfile}
          handleUploadImage={handleUploadImage}
          isSubscribed={isSubscribed}
          pushLoading={pushLoading}
          onTogglePushNotifications={handleTogglePushNotifications}
        />
      );
    case 'rewards':
      return (
        <Rewards
          user={user}
          redeemError={redeemError}
          redeemSuccess={redeemSuccess}
          handleRedeem={handleRedeem}
          secretCode={secretCode}
          setSecretCode={setSecretCode}
          showToast={showToast}
          triggerXpPopup={triggerXpPopup}
          claimMockReward={async (amt) => {}}
          unlockedCosmetics={unlockedCosmetics}
          handleShopPurchase={handleShopPurchase}
          hasOpenedBoxToday={!!(user && user.last_surprise_box_date === getLocalDateString())}
          handleClaimSurpriseBox={handleClaimSurpriseBox}
          handleBuyFrame={handleBuyFrame}
        />
      );
    case 'login':
      return (
        <Login
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          authError={authError}
          handleLogin={handleLogin}
          setCurrentPage={setCurrentPage}
        />
      );
    case 'register':
      return (
        <Register
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          authError={authError}
          authSuccess={authSuccess}
          handleRegister={handleRegister}
          setCurrentPage={setCurrentPage}
        />
      );
    case 'confirm':
      return (
        <Confirm
          confirmEmail={confirmEmail}
          confirmCode={confirmCode}
          setConfirmCode={setConfirmCode}
          authError={authError}
          authSuccess={authSuccess}
          handleConfirm={handleConfirm}
        />
      );
    case 'forgot-password':
      return (
        <ForgotPassword
          authError={authError}
          authSuccess={authSuccess}
          onSubmit={handleForgotPassword}
          setCurrentPage={setCurrentPage}
        />
      );
    case 'reset-password':
      return (
        <ResetPassword
          email={forgotEmail}
          authError={authError}
          authSuccess={authSuccess}
          onSubmit={handleResetPassword}
          setCurrentPage={setCurrentPage}
        />
      );
    case 'moderator-dashboard': {
      const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
      const userWeight = user ? (ROLE_WEIGHTS[user.role] || 0) : 0;
      if (userWeight < 1) {
        setTimeout(() => setCurrentPage('home'), 0);
        return null;
      }
      return (
        <ModeratorDashboard
          user={user}
          token={token}
          apiBase={apiBase}
          showConfirm={showConfirm}
          handleOpenModerationModal={handleOpenModerationModal}
          setCurrentPage={setCurrentPage}
          navigateToEpisode={navigateToEpisode}
        />
      );
    }
    case 'admin': {
      const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
      const userWeight = user ? (ROLE_WEIGHTS[user.role] || 0) : 0;
      if (userWeight < 2) {
        setTimeout(() => setCurrentPage('home'), 0);
        return null;
      }
      return (
        <Admin
          adminSection={adminSection}
          setAdminSection={setAdminSection}
          adminMessage={adminMessage}
          setAdminMessage={setAdminMessage}
          adminEpisodeForm={adminEpisodeForm}
          setAdminEpisodeForm={setAdminEpisodeForm}
          handleAdminCreateEpisode={handleAdminCreateEpisode}
          adminSubmitting={adminSubmitting}
          setAdminSubmitting={setAdminSubmitting}
          adminUsers={adminUsers}
          adminCodes={adminCodes}
          adminSuggestions={adminSuggestions}
          adminCodeForm={adminCodeForm}
          setAdminCodeForm={setAdminCodeForm}
          handleAdminCreateCode={handleAdminCreateCode}
          handleAdminUpdateUserRole={handleAdminUpdateUserRole}
          handleAdminUpdateSuggestionStatus={handleAdminUpdateSuggestionStatus}
          handleAdminDeleteCode={handleAdminDeleteCode}
          handleOpenModerationModal={handleOpenModerationModal}
          handleAdminDeleteUser={handleAdminDeleteUser}
          user={user}
          token={token}
          apiBase={apiBase}
          fetchXpSettings={fetchUserProfile}
          episodes={episodes}
          fetchEpisodes={async () => {}}
          showConfirm={showConfirm}
        />
      );
    }
    default:
      return null;
  }
};
