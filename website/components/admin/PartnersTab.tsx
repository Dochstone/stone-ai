"use client";

import React, { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const SITE = "https://stoneai.ru";

interface Partner {
  id: number;
  code: string;
  name: string | null;
  email: string | null;
  referral_percent: number;
  referral_balance: number;
  referral_count: number;
  joined_at: string | null;
}

interface Props {
  token: string;
}

export default function PartnersTab({ token }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState(20);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editPercent, setEditPercent] = useState(10);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Link generator
  const [linkPartnerId, setLinkPartnerId] = useState<number | null>(null);
  const [linkSource, setLinkSource] = useState("vk");
  const [linkMedium, setLinkMedium] = useState("cpc");
  const [linkCampaign, setLinkCampaign] = useState("");
  const [linkPage, setLinkPage] = useState("/");

  const fetchPartners = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPartners(data.partners || []);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          referral_percent: newPercent,
          name: newName.trim() || undefined,
          email: newEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setSuccess(`Partner ${data.partner.code} created`);
      setShowCreate(false);
      setNewCode("");
      setNewPercent(20);
      setNewName("");
      setNewEmail("");
      fetchPartners();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (partnerId: number) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referral_percent: editPercent,
          name: editName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setSuccess("Updated");
      setEditId(null);
      fetchPartners();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partnerId: number, code: string) => {
    if (!confirm(`Delete partner ${code}? This cannot be undone.`)) return;
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error");
      }
      setSuccess(`Partner ${code} deleted`);
      fetchPartners();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateLink = (code: string) => {
    const params = new URLSearchParams();
    params.set("ref", code);
    if (linkSource) params.set("utm_source", linkSource);
    if (linkMedium) params.set("utm_medium", linkMedium);
    if (linkCampaign) params.set("utm_campaign", linkCampaign);
    const page = linkPage.startsWith("/") ? linkPage : `/${linkPage}`;
    return `${SITE}${page}?${params.toString()}`;
  };

  const copyLink = (code: string) => {
    const url = generateLink(code);
    navigator.clipboard.writeText(url);
    setSuccess(`Copied: ${url}`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const inputClass = "bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 w-full";
  const btnPrimary = "bg-accent text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50";
  const btnSecondary = "border border-text/10 text-text/60 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-text/[0.04] transition-colors";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Partners</h2>
          <p className="text-text/40 text-sm mt-1">{partners.length} partners</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPartners} className={btnSecondary}>
            {loading ? "..." : "Refresh"}
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className={btnPrimary}>
            + New Partner
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400 hover:text-red-300">x</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl px-4 py-3 text-sm">
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 text-emerald-400 hover:text-emerald-300">x</button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-surface rounded-2xl border border-text/5 p-6 space-y-4">
          <h3 className="font-bold text-sm text-text/60 uppercase tracking-wider">New Partner</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-text/40 mb-1 block">Code *</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="VKPARTNER"
                required
                maxLength={16}
                minLength={3}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/40 mb-1 block">% comission</label>
              <input
                type="number"
                value={newPercent}
                onChange={(e) => setNewPercent(Number(e.target.value))}
                min={1}
                max={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/40 mb-1 block">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ivan VK Ads"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/40 mb-1 block">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="partner@mail.ru"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? "Creating..." : "Create Partner"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Partners Table */}
      <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-text/[0.02] text-text/40 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 text-left font-semibold">Code</th>
                <th className="py-3 px-4 text-left font-semibold">Name</th>
                <th className="py-3 px-4 text-center font-semibold">%</th>
                <th className="py-3 px-4 text-center font-semibold">Users</th>
                <th className="py-3 px-4 text-right font-semibold">Earned $</th>
                <th className="py-3 px-4 text-left font-semibold">Created</th>
                <th className="py-3 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-text/30">No partners yet</td>
                </tr>
              )}
              {partners.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-accent">{p.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-text/80">{p.name || "—"}</div>
                      {p.email && <div className="text-text/30 text-xs">{p.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-1 rounded-lg">
                        {p.referral_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{p.referral_count}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-500">
                      ${p.referral_balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-text/40 text-xs">
                      {p.joined_at ? new Date(p.joined_at).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setLinkPartnerId(linkPartnerId === p.id ? null : p.id);
                            setLinkCampaign(`partner_${p.code.toLowerCase()}`);
                          }}
                          className="text-xs text-blue-500 hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
                          title="Link generator"
                        >
                          Link
                        </button>
                        <button
                          onClick={() => {
                            if (editId === p.id) {
                              setEditId(null);
                            } else {
                              setEditId(p.id);
                              setEditPercent(p.referral_percent);
                              setEditName(p.name || "");
                            }
                          }}
                          className="text-xs text-amber-500 hover:text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Edit Row */}
                  {editId === p.id && (
                    <tr className="bg-amber-500/5 border-t border-amber-500/10">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex items-end gap-4 flex-wrap">
                          <div>
                            <label className="text-xs font-semibold text-text/40 mb-1 block">Name</label>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className={`${inputClass} w-48`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text/40 mb-1 block">% comission</label>
                            <input
                              type="number"
                              value={editPercent}
                              onChange={(e) => setEditPercent(Number(e.target.value))}
                              min={1}
                              max={50}
                              className={`${inputClass} w-24`}
                            />
                          </div>
                          <button
                            onClick={() => handleUpdate(p.id)}
                            disabled={saving}
                            className={btnPrimary}
                          >
                            {saving ? "..." : "Save"}
                          </button>
                          <button onClick={() => setEditId(null)} className={btnSecondary}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Link Generator Row */}
                  {linkPartnerId === p.id && (
                    <tr className="bg-blue-500/5 border-t border-blue-500/10">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div>
                              <label className="text-xs font-semibold text-text/40 mb-1 block">Page</label>
                              <select
                                value={linkPage}
                                onChange={(e) => setLinkPage(e.target.value)}
                                className={`${inputClass} w-40`}
                              >
                                <option value="/">Main page</option>
                                <option value="/pricing">Pricing</option>
                                <option value="/models">Models</option>
                                <option value="/webchat">Chat</option>
                                <option value="/dashboard/chat">Dashboard</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-text/40 mb-1 block">Source</label>
                              <select
                                value={linkSource}
                                onChange={(e) => setLinkSource(e.target.value)}
                                className={`${inputClass} w-32`}
                              >
                                <option value="vk">vk</option>
                                <option value="telegram">telegram</option>
                                <option value="youtube">youtube</option>
                                <option value="instagram">instagram</option>
                                <option value="google">google</option>
                                <option value="yandex">yandex</option>
                                <option value="direct">direct</option>
                                <option value="other">other</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-text/40 mb-1 block">Medium</label>
                              <select
                                value={linkMedium}
                                onChange={(e) => setLinkMedium(e.target.value)}
                                className={`${inputClass} w-32`}
                              >
                                <option value="cpc">cpc</option>
                                <option value="cpm">cpm</option>
                                <option value="social">social</option>
                                <option value="post">post</option>
                                <option value="banner">banner</option>
                                <option value="referral">referral</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-text/40 mb-1 block">Campaign</label>
                              <input
                                value={linkCampaign}
                                onChange={(e) => setLinkCampaign(e.target.value)}
                                placeholder="campaign_name"
                                className={`${inputClass} w-48`}
                              />
                            </div>
                            <button onClick={() => copyLink(p.code)} className={btnPrimary}>
                              Copy Link
                            </button>
                          </div>
                          <div className="bg-bg rounded-xl px-4 py-3 font-mono text-xs text-text/60 break-all select-all">
                            {generateLink(p.code)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
