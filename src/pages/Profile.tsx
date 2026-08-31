import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Heart, HelpCircle, ArrowRight, CheckCircle2, ChevronDown, MessageCircle, Send, FileText, Edit3, Camera, LogOut, Check } from "lucide-react";
import { tutorials } from "../data/tutorials";
import { loadUserTutorials } from "../lib/tutorialStore";
import { TutorialCard } from "../components/TutorialCard";
import { Avatar } from "../components/Avatar";
import { LogoMark } from "../components/Miffy";
import { useSettings } from "../lib/settings";
import { useAuth } from "../lib/auth";
import { loadDrafts, deleteDraft, type TutorialDraft } from "../lib/drafts";
import { isCosReady, uploadImageFromBase64 } from "../lib/cosUpload";

interface BoardMessage {
  id: string;
  author: string;
  text: string;
  date: string;
}

export function Profile() {
  const { settings } = useSettings();
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<TutorialDraft[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");

  useEffect(() => {
    if (user) {
      setDrafts(loadDrafts(user.id));
      setNameInput(user.name);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="page-enter container-app flex flex-col items-center gap-5 py-20 text-center">
        <LogoMark className="h-16 w-16 animate-floaty" cheek />
        <div>
          <p className="text-lg font-medium text-ink">还没选家人哦</p>
          <p className="mt-1 text-sm text-ink-muted">点一下你的头像，输密码就进去啦～</p>
        </div>
        <Link to="/members" className="btn-primary">去选家人</Link>
      </div>
    );
  }

  const allTutorials = [...loadUserTutorials(), ...tutorials];
  const learnedIds: string[] = JSON.parse(localStorage.getItem(`fth_learned_${user.id}`) || "[]");
  const savedIds: string[] = JSON.parse(localStorage.getItem(`fth_saved_${user.id}`) || "[]");
  const learned = allTutorials.filter(t => learnedIds.includes(t.id));
  const saved = allTutorials.filter(t => savedIds.includes(t.id));
  const pending = allTutorials
    .flatMap(t => t.comments
      .filter(c => c.author === user.name && c.replies.length === 0)
      .map(c => ({ tutorial: t, comment: c })));

  const stats = [
    { icon: CheckCircle2, label: "已学会", value: learned.length, tone: "text-sage" },
    { icon: Heart, label: "收藏", value: saved.length, tone: "text-miffy" },
    { icon: HelpCircle, label: "待解答", value: pending.length, tone: "text-wood-dark" },
  ];

  const saveName = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
      setEditingName(false);
    }
  };

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (isCosReady()) {
        const cosUrl = await uploadImageFromBase64(dataUrl);
        if (cosUrl) {
          updateProfile({ avatar: cosUrl });
          setAvatarInput("");
          return;
        }
      }
      updateProfile({ avatar: dataUrl });
      setAvatarInput("");
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="page-enter container-app py-6">
      {/* greeting */}
      <section className="card mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-[#fce4ec] to-cream-50 p-6 sm:flex-row sm:items-center">
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover ring-4 ring-white/60" />
            ) : (
              <Avatar name={user.name} color={user.avatarColor} size={64} ring />
            )}
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-miffy text-white shadow-md transition hover:bg-miffy-dark">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
            </label>
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="field !py-1.5 !px-3 text-base"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") saveName(); }}
                />
                <button onClick={saveName} className="btn-primary px-3 py-1.5 text-sm">
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink">{user.name}的小天地</h1>
                <button onClick={() => setEditingName(true)} className="rounded-full p-1.5 text-ink-muted hover:bg-cream-200 hover:text-miffy">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-ink-muted">
              加入于 {user.joinDate}{user.bio ? ` · ${user.bio}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-12 w-12 animate-floaty" cheek />
            <button
              onClick={() => { logout(); navigate("/members"); }}
              className="flex items-center gap-1 rounded-full bg-cream-200 px-3 py-1.5 text-xs text-ink-soft hover:bg-cream-300 hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" /> 切换
            </button>
          </div>
        </div>
      </section>

      {/* stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card flex flex-col items-center gap-1 p-4">
            <s.icon className={`h-5 w-5 ${s.tone}`} />
            <span className="text-2xl font-bold text-ink">{s.value}</span>
            <span className="text-xs text-ink-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* drafts */}
      {drafts.length > 0 && (
        <section className="mb-8">
          <button
            onClick={() => setExpanded(expanded === "drafts" ? null : "drafts")}
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-cream-50 px-4 py-3 text-left transition hover:shadow-soft"
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <FileText className="h-5 w-5 text-miffy" /> 草稿箱
              <span className="rounded-full bg-miffy-soft px-2 py-0.5 text-xs text-miffy-dark">{drafts.length}</span>
            </h2>
            <ChevronDown className={`h-5 w-5 text-ink-muted transition ${expanded === "drafts" ? "rotate-180" : ""}`} />
          </button>
          {expanded === "drafts" && (
            <div className="space-y-2">
              {drafts.map(d => (
                <Link
                  key={d.id}
                  to="/upload"
                  className="card flex items-center gap-3 p-3 transition hover:shadow-lift"
                >
                  {d.cover ? (
                    <img src={d.cover} alt="" className="h-10 w-14 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-cream-200">
                      <FileText className="h-4 w-4 text-ink-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{d.title || "未命名草稿"}</p>
                    <p className="text-xs text-ink-muted">{d.steps.length} 步 · {d.updatedAt.slice(0, 16)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); deleteDraft(d.id); setDrafts(loadDrafts(user.id)); }}
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-cream-200 hover:text-miffy"
                  >
                    <span className="text-xs">删除</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* pending questions — expandable */}
      {pending.length > 0 && (
        <section className="mb-8">
          <button
            onClick={() => setExpanded(expanded === "pending" ? null : "pending")}
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-cream-50 px-4 py-3 text-left transition hover:shadow-soft"
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <HelpCircle className="h-5 w-5 text-miffy" /> 待你解答的问题
              <span className="rounded-full bg-miffy-soft px-2 py-0.5 text-xs text-miffy-dark">{pending.length}</span>
            </h2>
            <ChevronDown className={`h-5 w-5 text-ink-muted transition ${expanded === "pending" ? "rotate-180" : ""}`} />
          </button>
          {expanded === "pending" && (
            <div className="space-y-3">
              {pending.map(({ tutorial, comment }) => (
                <Link
                  key={comment.id}
                  to={`/tutorial/${tutorial.id}`}
                  className="card flex items-start gap-4 p-4 transition hover:shadow-lift"
                >
                  <Avatar name={comment.author} color="#A8B89A" size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{comment.text}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      来自「{tutorial.title}」· {comment.date}
                    </p>
                    {comment.replies.length > 0 && (
                      <p className="mt-1 text-xs text-sage">已有回复 ✓</p>
                    )}
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* message board */}
      <MessageBoard userName={user.name} />

      {/* saved */}
      <section className="mb-8 mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
          <Heart className="h-5 w-5 text-miffy" /> 想学的收藏
        </h2>
        {saved.length ? (
          <div className="masonry">
            {saved.map(t => <TutorialCard key={t.id} tutorial={t} />)}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 py-12 text-center">
            <LogoMark className="h-12 w-12" />
            <p className="text-sm text-ink-muted">还没有收藏，去教程区逛逛吧～</p>
            <Link to="/browse" className="btn-butter">逛逛教程</Link>
          </div>
        )}
      </section>

      {/* learned */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
          <BookOpen className="h-5 w-5 text-sage" /> 已经学会的
        </h2>
        {learned.length ? (
          <div className="masonry">
            {learned.map(t => <TutorialCard key={t.id} tutorial={t} />)}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 py-12 text-center">
            <LogoMark className="h-12 w-12" cheek />
            <p className="text-sm text-ink-muted">还没标记学会，学完一篇就点"学会"吧～</p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ===== Message Board ===== */
function MessageBoard({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<BoardMessage[]>(() => {
    try {
      const stored = localStorage.getItem("boardMessages");
      if (stored) return JSON.parse(stored);
    } catch { /* noop */ }
    return [];
  });
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try { localStorage.setItem("boardMessages", JSON.stringify(messages)); } catch { /* noop */ }
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const msg: BoardMessage = {
      id: `m-${Date.now()}`,
      author: userName,
      text: t,
      date: new Date().toISOString().slice(0, 10),
    };
    setMessages(prev => [msg, ...prev]);
    setText("");
  };

  return (
    <section className="mb-8">
      <button
        onClick={() => setExpanded(v => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-2xl bg-cream-50 px-4 py-3 text-left transition hover:shadow-soft"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <MessageCircle className="h-5 w-5 text-miffy" /> 留言板
          {messages.length > 0 && (
            <span className="rounded-full bg-miffy-soft px-2 py-0.5 text-xs text-miffy-dark">{messages.length}</span>
          )}
        </h2>
        <ChevronDown className={`h-5 w-5 text-ink-muted transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="card p-4">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder="给家人留句话吧～"
              className="field flex-1"
            />
            <button onClick={send} className="btn-primary px-4">
              <Send className="h-4 w-4" />
            </button>
          </div>
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className="flex items-start gap-3 border-b border-wood/10 pb-3 last:border-0">
                  <Avatar name={m.author} color="#C45A7A" size={28} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{m.author}</span>
                      <span className="text-xs text-ink-muted">{m.date}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">
              还没有留言，第一个来写吧～
            </p>
          )}
        </div>
      )}
    </section>
  );
}
