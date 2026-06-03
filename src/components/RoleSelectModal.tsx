import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Users, X, Loader2, AlertTriangle } from 'lucide-react';

interface RoleOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
}

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: number; username: string; role: string } | null;
  currentUserRole: string;
  onConfirm: (userId: number, newRole: string) => Promise<void>;
  isLoading: boolean;
}

export const RoleSelectModal: React.FC<RoleSelectModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUserRole,
  onConfirm,
  isLoading,
}) => {
  const [confirmRole, setConfirmRole] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const ROLE_WEIGHTS: Record<string, number> = { user: 0, moderator: 1, admin: 2, owner: 3 };
  const currentWeight = ROLE_WEIGHTS[currentUserRole] || 0;

  const roleLabels: Record<string, string> = {
    user: 'Student',
    moderator: 'Moderator',
    admin: 'Admin',
    owner: 'Owner',
  };

  const allRoles: RoleOption[] = [
    {
      id: 'user',
      label: 'Student',
      description: 'Default role. Can access community features, chat, games, and leaderboards.',
      icon: <Users className="w-5 h-5" />,
      colorClass: 'border-white/10 hover:border-zinc-500/40 hover:bg-zinc-500/5 text-zinc-400',
      badgeClass: 'bg-white/5 text-zinc-500 border-white/10',
    },
    {
      id: 'moderator',
      label: 'Moderator',
      description: 'Can moderate posts, comments, suggestions, chat messages, and manage user restrictions (mutes/bans).',
      icon: <ShieldAlert className="w-5 h-5" />,
      colorClass: 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-emerald-400',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    },
    {
      id: 'admin',
      label: 'Admin',
      description: 'Full administrative access. Can manage users, create XP codes, add cosmetics, and configure settings.',
      icon: <ShieldCheck className="w-5 h-5" />,
      colorClass: 'border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 text-orange-400',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    },
  ];

  // Dynamic filter based on permission rules:
  // - Owner (weight 3) can assign Student, Moderator, Admin.
  // - Admin (weight 2) can assign:
  //   - If target is Student ('user'): Moderator.
  //   - If target is Moderator: Student or Admin.
  const assignableRoles = allRoles.filter(role => {
    if (role.id === targetUser.role) return false; // hide current role
    if (currentWeight === 3) return true; // Owner can assign all non-owner roles
    if (currentUserRole === 'admin') {
      if (targetUser.role === 'user') {
        return role.id === 'moderator'; // Student -> Moderator
      }
      if (targetUser.role === 'moderator') {
        return role.id === 'user' || role.id === 'admin'; // Moderator -> Student or Moderator -> Admin
      }
    }
    return false;
  });

  const handleSelectRole = (roleId: string) => {
    setConfirmRole(roleId);
  };

  const handleConfirmSubmit = async () => {
    if (!confirmRole) return;
    await onConfirm(targetUser.id, confirmRole);
    setConfirmRole(null);
    onClose();
  };

  const handleCancelConfirm = () => {
    setConfirmRole(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 relative flex flex-col gap-5 border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5 text-orange-400">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-black tracking-tight">Manage User Role</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/8 text-zinc-400 hover:text-white cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {confirmRole ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400 animate-pulse">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Confirm Role Update</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to change <span className="text-white font-bold">@{targetUser.username}</span>'s role from{' '}
                <span className="text-orange-400 font-bold">{roleLabels[targetUser.role]}</span> to{' '}
                <span className="text-orange-400 font-bold">{roleLabels[confirmRole]}</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={isLoading}
                onClick={handleConfirmSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Change'}
              </button>
              <button
                onClick={handleCancelConfirm}
                className="border border-zinc-800 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target User</p>
              <p className="text-sm font-black text-white mt-0.5">@{targetUser.username}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                Current Role:{' '}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                  allRoles.find(r => r.id === targetUser.role)?.badgeClass || 'bg-white/5 text-zinc-500'
                }`}>
                  {roleLabels[targetUser.role] || targetUser.role}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Select Assignable Role</p>
              
              {assignableRoles.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center italic">No roles are assignable for this user under hierarchy rules.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {assignableRoles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleSelectRole(role.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border bg-white/2 hover:scale-[1.01] transition-all text-left group ${role.colorClass}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                        {role.icon}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{role.label}</p>
                        <p className="text-[10px] text-zinc-500 leading-normal">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
