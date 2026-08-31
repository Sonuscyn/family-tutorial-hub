import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Plus, X, UserPlus, Check, Trash2 } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { LogoMark } from "../components/Miffy";
import { useAuth, avatarColors, type FamilyUser } from "../lib/auth";
import { useSettings } from "../lib/settings";

export function Members() {
  const { settings } = useSettings();
  const { users, login, register, deleteMember } = useAuth();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  // new member form
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newColor, setNewColor] = useState(avatarColors[0]);
  const [addError, setAddError] = useState("");

  // delete member with admin password
  const [deleteTarget, setDeleteTarget] = useState<FamilyUser | null>(null);
  const [adminPwd, setAdminPwd] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const pickMember = (id: string) => {
    setSelectedId(id);
    setPwd("");
    setError("");
  };

  const tryLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setError("");
    const result = login(selectedId, pwd);
    if (!result.ok) { setError(result.error || "登录失败"); return; }
    navigate("/");
  };

  const tryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const result = register(newName, newPwd, newColor);
    if (!result.ok) { setAddError(result.error || "添加失败"); return; }
    setAdding(false);
    setNewName(""); setNewPwd(""); setNewColor(avatarColors[0]);
    navigate("/");
  };

  const tryDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleteError("");
    if (adminPwd !== settings.password) { setDeleteError("管理员密码不对"); return; }
    deleteMember(deleteTarget.id);
    setDeleteTarget(null);
    setAdminPwd("");
  };

  const selectedUser = users.find(u => u.id === selectedId);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#fce4ec] via-[#f8d7e8] to-[#f3b5cf] px-4 py-10">
      {/* background orbs */}
      <div className="ripple-orb" style={{ top: "-40px", right: "-60px", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(255,182,193,0.4), transparent)" }} />
      <div className="ripple-orb" style={{ bottom: "-40px", left: "-80px", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(255,218,222,0.35), transparent)", animationDelay: "-4s" }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* header */}
        <div className="mb-8 text-center">
          <div className="glass mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
            <LogoMark className="h-11 w-11" cheek />
          </div>
          <h1 className="font-song text-3xl font-bold text-[#8B3A5A]">你是谁？</h1>
          <p className="mt-1 text-sm text-[#B07090]">点你的头像，输密码就进去啦</p>
        </div>

        {/* member grid */}
        <div className="glass rounded-3xl p-6">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => pickMember(u.id)}
                className={`group flex flex-col items-center gap-2 rounded-2xl p-3 transition ${
                  selectedId === u.id ? "bg-white/80 shadow-md" : "hover:bg-white/40"
                }`}
              >
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-full transition group-hover:scale-105 ${
                  selectedId === u.id ? "ring-4 ring-[#C45A7A]/30" : ""
                }`}>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <Avatar name={u.name} color={u.avatarColor} size={80} ring />
                  )}
                </div>
                <span className="text-sm font-medium text-[#8B3A5A]">{u.name}</span>
              </button>
            ))}

            {/* add new member */}
            <button
              onClick={() => setAdding(true)}
              className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#C45A7A]/30 p-3 transition hover:border-[#C45A7A]/50 hover:bg-white/30"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/40">
                <Plus className="h-8 w-8 text-[#C45A7A]/60" />
              </div>
              <span className="text-sm text-[#B07090]">添加</span>
            </button>
          </div>

          {/* manage members (delete) */}
          {users.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#C45A7A]/10 pt-4">
              <span className="self-center text-xs text-[#B07090]">管理成员：</span>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { setDeleteTarget(u); setAdminPwd(""); setDeleteError(""); }}
                  className="flex items-center gap-1 rounded-full bg-white/40 px-2.5 py-1 text-xs text-[#B07090] hover:bg-[#e07a5f]/10 hover:text-[#e07a5f]"
                >
                  <Trash2 className="h-3 w-3" /> {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[#B07090]/70">
          {settings.siteName} · 点头像输密码就好
        </p>
      </div>

      {/* password modal */}
      {selectedUser && !adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-xs rounded-3xl p-8">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setSelectedId(null)} className="rounded-full p-1 text-[#B07090] hover:bg-white/40">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-[#C45A7A]/20">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <Avatar name={selectedUser.name} color={selectedUser.avatarColor} size={80} ring />
                )}
              </div>
              <p className="text-lg font-bold text-[#8B3A5A]">{selectedUser.name}</p>
            </div>
            <form onSubmit={tryLogin} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B07090]" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={e => { setPwd(e.target.value); setError(""); }}
                  placeholder="输密码"
                  autoFocus
                  className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 py-3 pl-10 pr-10 text-center text-lg tracking-[0.2em] text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B07090]">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-center text-sm text-[#e07a5f]">{error}</p>}
              <button type="submit"
                className="w-full rounded-2xl bg-[#C45A7A] px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#A04068]">
                进入
              </button>
            </form>
          </div>
        </div>
      )}

      {/* add member modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-3xl p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#C45A7A]">
                <UserPlus className="h-4 w-4" /> 添加家人
              </span>
              <button onClick={() => setAdding(false)} className="rounded-full p-1 text-[#B07090] hover:bg-white/40">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={tryAdd} className="space-y-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-[#C45A7A]/20"
                  style={{ backgroundColor: newColor + "33" }}>
                  <span className="text-2xl font-bold" style={{ color: newColor }}>
                    {newName ? newName[0] : "?"}
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="名字（如：爸爸）"
                autoFocus
                className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10"
              />
              <input
                type="text"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="设一个密码（至少 3 位）"
                className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10"
              />
              <div className="flex flex-wrap gap-2">
                {avatarColors.map(c => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      newColor === c ? "border-[#C45A7A] scale-110" : "border-white/60"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              {addError && <p className="text-center text-sm text-[#e07a5f]">{addError}</p>}
              <button type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#C45A7A] px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#A04068]">
                <Check className="h-4 w-4" /> 添加并进入
              </button>
            </form>
          </div>
        </div>
      )}

      {/* delete member modal — requires admin password */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-xs rounded-3xl p-8">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setDeleteTarget(null)} className="rounded-full p-1 text-[#B07090] hover:bg-white/40">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-[#e07a5f]/20">
                {deleteTarget.avatar ? (
                  <img src={deleteTarget.avatar} alt={deleteTarget.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <Avatar name={deleteTarget.name} color={deleteTarget.avatarColor} size={64} ring />
                )}
              </div>
              <p className="text-lg font-bold text-[#8B3A5A]">删除「{deleteTarget.name}」？</p>
              <p className="text-center text-sm text-[#B07090]">输入管理员密码才能删除</p>
            </div>
            <form onSubmit={tryDelete} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B07090]" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={adminPwd}
                  onChange={e => { setAdminPwd(e.target.value); setDeleteError(""); }}
                  placeholder="管理员密码"
                  autoFocus
                  className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 py-3 pl-10 pr-10 text-center text-lg tracking-[0.2em] text-[#8B3A5A] outline-none focus:border-[#e07a5f]/40 focus:ring-2 focus:ring-[#e07a5f]/10"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B07090]">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {deleteError && <p className="text-center text-sm text-[#e07a5f]">{deleteError}</p>}
              <button type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#e07a5f] px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#c0684a]">
                <Trash2 className="h-4 w-4" /> 确认删除
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
