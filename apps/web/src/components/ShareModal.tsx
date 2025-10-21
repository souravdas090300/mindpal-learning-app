/**
 * ShareModal Component
 * 
 * Modal for sharing documents with other users and generating shareable links.
 * Features:
 * - Share with users by email (view/edit permissions)
 * - Generate public shareable links
 * - Manage existing shares and links
 * - Copy links to clipboard
 * - Set link expiration
 * - View access statistics
 * 
 * @component
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api';

interface ShareUser {
  id: string;
  name: string;
  email: string;
}

interface DocumentShare {
  id: string;
  document_id: string;
  owner_id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit';
  shared_at: string;
  updated_at: string;
  user: ShareUser;
}

interface ShareLink {
  id: string;
  document_id: string;
  owner_id: string;
  share_token: string;
  permission: 'view' | 'edit';
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
  is_active: boolean;
  url: string;
}

interface ShareModalProps {
  document: {
    id: string;
    title: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ document, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'links'>('users');
  const [userEmail, setUserEmail] = useState('');
  const [userPermission, setUserPermission] = useState<'view' | 'edit'>('view');
  const [linkPermission, setLinkPermission] = useState<'view' | 'edit'>('view');
  const [linkExpiration, setLinkExpiration] = useState<number>(7);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingUser, setSharingUser] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load shares and links
  useEffect(() => {
    if (isOpen) {
      loadSharesAndLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.document.addEventListener('keydown', handleEscape);
      return () => window.document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const loadSharesAndLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sharesData, linksData] = await Promise.all([
        apiClient.getSharedWith(document.id),
        apiClient.getShareLinks(document.id),
      ]);
      setShares(sharesData);
      setLinks(linksData);
    } catch (err) {
      setError('Failed to load sharing data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    setSharingUser(true);
    setError(null);
    try {
      const result = await apiClient.shareDocument(document.id, userEmail, userPermission);
      setShares([...shares, result.share]);
      setUserEmail('');
      setUserPermission('view');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to share document');
      } else {
        setError('Failed to share document');
      }
      console.error(err);
    } finally {
      setSharingUser(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Remove this user\'s access?')) return;
    try {
      await apiClient.revokeShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      setError('Failed to remove share');
      console.error(err);
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'edit') => {
    try {
      const updated = await apiClient.updateSharePermission(shareId, newPermission);
      setShares(shares.map(s => s.id === shareId ? updated : s));
    } catch (err) {
      setError('Failed to update permission');
      console.error(err);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setError(null);
    try {
      const result = await apiClient.generateShareLink(
        document.id,
        linkPermission,
        linkExpiration > 0 ? linkExpiration : undefined
      );
      setLinks([result.link, ...links]);
    } catch (err) {
      setError('Failed to generate link');
      console.error(err);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDeactivateLink = async (linkId: string) => {
    if (!confirm('Deactivate this shareable link?')) return;
    try {
      await apiClient.deactivateShareLink(linkId);
      setLinks(links.map(l => l.id === linkId ? { ...l, is_active: false } : l));
    } catch (err) {
      setError('Failed to deactivate link');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🔗 Share Document
              </h2>
              <p className="text-blue-100 text-sm mt-1 truncate max-w-md">
                {document.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              👥 Share with Users
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'links'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🔗 Shareable Links
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Share with user form */}
              <form onSubmit={handleShareWithUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sharingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Permission
                  </label>
                  <select
                    value={userPermission}
                    onChange={(e) => setUserPermission(e.target.value as 'view' | 'edit')}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sharingUser}
                  >
                    <option value="view">👁️ View Only</option>
                    <option value="edit">✏️ Can Edit</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sharingUser || !userEmail.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharingUser ? 'Sharing...' : '✉️ Send Invitation'}
                </button>
              </form>

              {/* Existing shares */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Shared With ({shares.length})
                </h3>
                {loading ? (
                  <div className="text-gray-400 text-center py-8">Loading...</div>
                ) : shares.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No users yet. Share to collaborate!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">{share.user.name}</p>
                          <p className="text-gray-400 text-sm">{share.user.email}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Shared {formatDate(share.shared_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={share.permission}
                            onChange={(e) => handleUpdatePermission(share.id, e.target.value as 'view' | 'edit')}
                            className="px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="view">👁️ View</option>
                            <option value="edit">✏️ Edit</option>
                          </select>
                          <button
                            onClick={() => handleRemoveShare(share.id)}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Generate link form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Permission
                    </label>
                    <select
                      value={linkPermission}
                      onChange={(e) => setLinkPermission(e.target.value as 'view' | 'edit')}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={generatingLink}
                    >
                      <option value="view">👁️ View Only</option>
                      <option value="edit">✏️ Can Edit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expires In
                    </label>
                    <select
                      value={linkExpiration}
                      onChange={(e) => setLinkExpiration(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={generatingLink}
                    >
                      <option value={1}>1 Day</option>
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={0}>Never</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateLink}
                  disabled={generatingLink}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingLink ? 'Generating...' : '➕ Generate New Link'}
                </button>
              </div>

              {/* Existing links */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Active Links ({links.filter(l => l.is_active).length})
                </h3>
                {loading ? (
                  <div className="text-gray-400 text-center py-8">Loading...</div>
                ) : links.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No links yet. Generate one to share!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className={`p-4 rounded-lg border ${
                          link.is_active
                            ? 'bg-slate-700/50 border-slate-600'
                            : 'bg-slate-800/50 border-slate-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                link.permission === 'view' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {link.permission === 'view' ? '👁️ View' : '✏️ Edit'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                link.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {link.is_active ? '✅ Active' : '⛔ Inactive'}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm break-all font-mono">{link.url}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>📅 Created {formatDate(link.created_at)}</span>
                              {link.expires_at && (
                                <span>⏰ Expires {formatDate(link.expires_at)}</span>
                              )}
                              <span>👁️ {link.access_count} views</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {link.is_active && (
                              <button
                                onClick={() => handleCopyLink(link.url, link.id)}
                                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm whitespace-nowrap"
                              >
                                {copiedLinkId === link.id ? '✅ Copied!' : '📋 Copy'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeactivateLink(link.id)}
                              disabled={!link.is_active}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
