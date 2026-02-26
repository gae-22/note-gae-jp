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
    <div className="border-glass-border bg-void-800 fixed inset-y-0 right-0 z-50 w-80 animate-[slide-in-right_0.2s_var(--ease-out)] border-l shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-glass-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-heading text-void-50 text-sm font-semibold">Note Settings</h2>
          <button
            onClick={onClose}
            className="text-void-300 hover:bg-void-700 hover:text-void-100 rounded p-1 transition-colors"
          >
            <LuX size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Visibility */}
          <section>
            <h3 className="text-void-200 mb-3 text-xs font-medium tracking-wider uppercase">
              Visibility
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onTogglePublic(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isPublic
                    ? 'border-accent-500/30 bg-accent-glow text-accent-500 border'
                    : 'border-glass-border bg-void-700 text-void-300 hover:text-void-100 border'
                }`}
              >
                <LuGlobe size={14} />
                Public
              </button>
              <button
                onClick={() => onTogglePublic(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  !isPublic
                    ? 'border-accent-500/30 bg-accent-glow text-accent-500 border'
                    : 'border-glass-border bg-void-700 text-void-300 hover:text-void-100 border'
                }`}
              >
                <LuLock size={14} />
                Private
              </button>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h3 className="text-void-200 mb-3 text-xs font-medium tracking-wider uppercase">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-accent-glow text-accent-500 ring-accent-500/30 ring-1'
                      : 'bg-void-700 text-void-200 hover:text-void-100'
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
              {allTags.length === 0 && <p className="text-void-300 text-xs">No tags yet.</p>}
            </div>
          </section>

          {/* Share Links */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-void-200 text-xs font-medium tracking-wider uppercase">
                Share Links
              </h3>
              <button
                onClick={() => setShowCreateToken(!showCreateToken)}
                className="text-accent-500 hover:bg-void-700 flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
              >
                <LuPlus size={12} />
                New
              </button>
            </div>

            {/* Create token form */}
            {showCreateToken && (
              <div className="border-glass-border bg-void-700 mb-3 space-y-2 rounded-lg border p-3">
                <input
                  type="text"
                  value={newTokenLabel}
                  onChange={(e) => setNewTokenLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="border-glass-border bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none"
                />
                <select
                  value={newTokenExpiry}
                  onChange={(e) => setNewTokenExpiry(e.target.value as typeof newTokenExpiry)}
                  className="border-glass-border bg-void-600 text-void-50 focus:border-accent-500 w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none"
                >
                  <option value="1h">1 hour</option>
                  <option value="1d">1 day</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
                <button
                  onClick={handleCreateToken}
                  disabled={createToken.isPending}
                  className="bg-accent-500 text-void-900 hover:bg-accent-400 w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Create Link
                </button>
              </div>
            )}

            {/* Token list */}
            <div className="space-y-2">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className={`rounded-lg border p-3 ${
                    token.isRevoked
                      ? 'border-void-600 bg-void-700/50 opacity-50'
                      : 'border-glass-border bg-void-700'
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <LuLink size={12} className="text-accent-500 shrink-0" />
                    <span className="text-void-100 truncate text-xs font-medium">
                      {token.label || 'Untitled'}
                    </span>
                  </div>
                  <p className="text-void-300 mb-2 text-xs">
                    Expires {new Date(token.expiresAt).toLocaleDateString()}
                    {token.isRevoked && ' — Revoked'}
                  </p>
                  {!token.isRevoked && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleCopy(token.shareUrl, token.id)}
                        className="text-void-200 hover:bg-void-600 hover:text-void-50 flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                      >
                        {copiedId === token.id ? (
                          <>
                            <LuCheck size={12} className="text-success" /> Copied
                          </>
                        ) : (
                          <>
                            <LuCopy size={12} /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => revokeToken.mutate(token.id)}
                        className="text-error hover:bg-void-600 flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                      >
                        <LuShieldOff size={12} />
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {tokens.length === 0 && <p className="text-void-300 text-xs">No share links yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
