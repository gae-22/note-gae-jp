import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useShareTokens, useCreateShareToken, useRevokeToken } from '@/hooks/use-tokens';
import { useTags } from '@/hooks/use-tags';
import type { NoteListItem, Tag } from '@note-gae/shared';
import {
  LuX,
  LuGlobe,
  LuLock,
  LuLink,
  LuCopy,
  LuShieldOff,
  LuPlus,
  LuTag,
  LuTrash2,
  LuCheck,
} from 'react-icons/lu';

interface NoteSettingsPanelProps {
  noteId: string;
  isPublic: boolean;
  noteTags: { id: string; name: string; color: string }[];
  onTogglePublic: (isPublic: boolean) => void;
  onUpdateTags: (tagIds: string[]) => void;
  onClose: () => void;
}

export function NoteSettingsPanel({
  noteId,
  isPublic,
  noteTags,
  onTogglePublic,
  onUpdateTags,
  onClose,
}: NoteSettingsPanelProps) {
  const { data: tagsData } = useTags();
  const { data: tokensData } = useShareTokens(noteId);
  const createToken = useCreateShareToken(noteId);
  const revokeToken = useRevokeToken(noteId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenExpiry, setNewTokenExpiry] = useState<'1h' | '1d' | '7d' | '30d'>('7d');
  const [showCreateToken, setShowCreateToken] = useState(false);

  const allTags = tagsData?.tags ?? [];
  const tokens = tokensData?.tokens ?? [];
  const selectedTagIds = noteTags.map((t) => t.id);

  const handleTagToggle = (tagId: string) => {
    const newIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onUpdateTags(newIds);
  };

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateToken = async () => {
    await createToken.mutateAsync({
      label: newTokenLabel || undefined,
      expiresIn: newTokenExpiry,
    });
    setNewTokenLabel('');
    setShowCreateToken(false);
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-zinc-900/20 dark:bg-black/40 z-40 sm:hidden backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="border-l border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl fixed inset-y-0 right-0 z-50 w-80 animate-[slide-in-right_0.25s_var(--ease-spring)] shadow-2xl transition-colors">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 px-5 py-4">
            <h2 className="font-heading text-zinc-900 dark:text-zinc-50 text-base font-bold tracking-tight">Document Settings</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 rounded-lg p-1.5 transition-colors"
            >
              <LuX size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto p-5">
            {/* Visibility — Neumorphism 2.0 */}
            <section>
              <h3 className="text-zinc-500 dark:text-zinc-400 mb-3 text-[10px] font-bold tracking-widest uppercase">
                Visibility
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onTogglePublic(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
                    isPublic
                      ? 'neo-toggle-active'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border-zinc-200 dark:border-zinc-700/50'
                  }`}
                >
                  <LuGlobe size={16} className={isPublic ? 'text-indigo-500' : 'text-zinc-400'} />
                  Public
                </button>
                <button
                  onClick={() => onTogglePublic(false)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
                    !isPublic
                      ? 'neo-toggle-active'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border-zinc-200 dark:border-zinc-700/50'
                  }`}
                >
                  <LuLock size={16} className={!isPublic ? 'text-indigo-500' : 'text-zinc-400'} />
                  Private
                </button>
              </div>
            </section>

            {/* Tags */}
            <section>
              <h3 className="text-zinc-500 dark:text-zinc-400 mb-3 text-[10px] font-bold tracking-widest uppercase">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-50 border-zinc-200/50 dark:border-zinc-700/50'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
                {allTags.length === 0 && <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">No tags yet.</p>}
              </div>
            </section>

            {/* Share Links */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
                  Share Links
                </h3>
                <button
                  onClick={() => setShowCreateToken(!showCreateToken)}
                  className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors"
                >
                  <LuPlus size={14} />
                  New
                </button>
              </div>

              {/* Create token form */}
              {showCreateToken && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 mb-4 space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <input
                    type="text"
                    value={newTokenLabel}
                    onChange={(e) => setNewTokenLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                  />
                  <select
                    value={newTokenExpiry}
                    onChange={(e) => setNewTokenExpiry(e.target.value as typeof newTokenExpiry)}
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                  >
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                  <button
                    onClick={handleCreateToken}
                    disabled={createToken.isPending}
                    className="btn-primary w-full rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed"
                  >
                    Create Link
                  </button>
                </div>
              )}

              {/* Token list */}
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`rounded-xl border p-3.5 transition-all ${
                      token.isRevoked
                        ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-50'
                        : 'border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 shadow-sm hover:shadow-md glass-card'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <LuLink size={14} className="text-indigo-500/60 shrink-0" />
                      <span className="text-zinc-900 dark:text-zinc-100 truncate text-sm font-semibold">
                        {token.label || 'Untitled Link'}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-3 text-xs font-mono">
                      Expires {new Date(token.expiresAt).toLocaleDateString()}
                      {token.isRevoked && ' — Revoked'}
                    </p>
                    {!token.isRevoked && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(token.shareUrl, token.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all border ${
                            copiedId === token.id
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-600/50 border-zinc-200/50 dark:border-zinc-600/50'
                          }`}
                        >
                          {copiedId === token.id ? (
                            <>
                              <LuCheck size={14} /> Copied
                            </>
                          ) : (
                            <>
                              <LuCopy size={14} /> Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => revokeToken.mutate(token.id)}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                        >
                          <LuShieldOff size={14} />
                          Revoke
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {tokens.length === 0 && <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">No share links yet.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
