import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Heart, Share2, BookOpen, Edit3, Trash2, Video, MessageCircle, Send } from "lucide-react";
import { tutorials } from "../data/tutorials";
import { StepNavigator } from "../components/StepNavigator";
import { ImageWithAnnotation } from "../components/ImageWithAnnotation";
import { Avatar } from "../components/Avatar";
import { LogoMark } from "../components/Miffy";
import { useAuth } from "../lib/auth";
import { getUserTutorial, deleteUserTutorial, type UserTutorial } from "../lib/tutorialStore";
import { useSettings } from "../lib/settings";
import type { Comment } from "../types";

type AnyTutorial = typeof tutorials[0] | UserTutorial;

function isUserTutorial(t: AnyTutorial): t is UserTutorial {
  return (t as UserTutorial).isUserCreated === true;
}

export function TutorialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [showDelete, setShowDelete] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  // look up in user tutorials first, then static
  const userTutorial = id ? getUserTutorial(id) : undefined;
  const tutorial: AnyTutorial | undefined = userTutorial ?? tutorials.find((t) => t.id === id);

  const [current, setCurrent] = useState(0);
  const [learned, setLearned] = useState<boolean[]>(
    () => (tutorial ? tutorial.steps.map(() => false) : [])
  );
  const [saved, setSaved] = useState(false);
  // comments stored locally for user tutorials
  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    if (userTutorial) {
      try {
        const raw = localStorage.getItem(`fth_tut_comments_${userTutorial.id}`);
        if (raw) return JSON.parse(raw) as Comment[];
      } catch { /* noop */ }
    }
    return userTutorial?.comments ?? [];
  });
  const [newComment, setNewComment] = useState("");

  if (!tutorial) {
    return (
      <div className="container-app flex flex-col items-center gap-4 py-24 text-center">
        <LogoMark className="h-16 w-16" cheek />
        <p className="text-lg font-medium text-ink">这篇教程走丢啦</p>
        <Link to="/browse" className="btn-butter">回到教程</Link>
      </div>
    );
  }

  const step = tutorial.steps[current];
  const allLearned = learned.every(Boolean);
  const isMine = isUserTutorial(tutorial) && user && tutorial.userId === user.id;

  const toggleLearned = () =>
    setLearned((arr) => arr.map((v, i) => (i === current ? !v : v)));

  const handleDelete = () => {
    if (adminPwd === settings.password) {
      deleteUserTutorial(tutorial.id);
      navigate("/browse");
    } else {
      setPwdError(true);
    }
  };

  const addComment = () => {
    if (!user || !newComment.trim()) return;
    const c = {
      id: `c-${Date.now()}`,
      author: user.name,
      avatarColor: user.avatarColor,
      text: newComment.trim(),
      date: new Date().toISOString().slice(0, 10),
      replies: [],
    };
    const updated = [...localComments, c];
    setLocalComments(updated);
    if (isUserTutorial(tutorial)) {
      try { localStorage.setItem(`fth_tut_comments_${tutorial.id}`, JSON.stringify(updated)); } catch { /* quota */ }
    }
    setNewComment("");
  };

  return (
    <div className="page-enter container-app py-6">
      <Link to={`/browse?cat=${encodeURIComponent(tutorial.category)}`} className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 返回{tutorial.category}
      </Link>

      {/* title block */}
      <header className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip-active">{tutorial.category}</span>
          <span className="chip-outline"><BookOpen className="h-3.5 w-3.5" /> {tutorial.steps.length} 步</span>
          {tutorial.tags.map((t) => (
            <span key={t} className="chip-outline">#{t}</span>
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {tutorial.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{tutorial.intro}</p>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={tutorial.author} color={tutorial.avatarColor} size={36} />
          <div>
            <p className="text-sm font-medium text-ink">{tutorial.author}</p>
            <p className="text-xs text-ink-muted">{tutorial.authorRole} · {tutorial.date}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isMine && (
              <>
                <Link to={`/upload?edit=${tutorial.id}`} className="btn-ghost px-3 py-2.5 text-sm">
                  <Edit3 className="h-4 w-4" /> 编辑
                </Link>
                <button
                  onClick={() => setShowDelete(true)}
                  className="rounded-full px-3 py-2.5 text-sm text-[#e07a5f] transition hover:bg-[#e07a5f]/8"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setSaved((v) => !v)}
              className={`btn px-4 py-2.5 text-sm transition ${
                saved ? "bg-miffy-soft text-miffy-dark" : "btn-ghost"
              }`}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-miffy text-miffy" : ""}`} />
              {saved ? "已收藏" : "收藏"}
            </button>
            <button className="btn-ghost" aria-label="分享">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* step card */}
          <article className="card overflow-hidden">
            {step.imagePrompt ? (
              <ImageWithAnnotation
                imagePrompt={step.imagePrompt}
                alt={step.title}
                size="landscape_16_9"
                annotations={step.annotations ?? []}
              />
            ) : step.video ? (
              <video src={step.video} controls className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-cream-200 text-sm text-ink-muted">
                这一步没有图片或视频
              </div>
            )}
            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="chip bg-miffy text-white">步骤 {current + 1}</span>
                <h2 className="text-lg font-semibold text-ink">{step.title}</h2>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-soft">{step.text}</p>

              {step.video && step.imagePrompt && (
                <div className="mt-4">
                  <span className="chip-outline mb-2 inline-flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> 这一步有视频
                  </span>
                  <video src={step.video} controls className="w-full rounded-2xl" />
                </div>
              )}

              <button
                onClick={toggleLearned}
                className={`mt-5 w-full btn py-3 text-sm transition ${
                  learned[current]
                    ? "bg-miffy-soft text-miffy-dark"
                    : "bg-miffy text-white hover:bg-miffy-dark"
                }`}
              >
                {learned[current] ? (
                  <><Check className="h-4 w-4" /> 这一步学会啦</>
                ) : (
                  <>标记这一步学会 ✓</>
                )}
              </button>
            </div>
          </article>

          {/* comments */}
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
              <MessageCircle className="h-5 w-5 text-miffy" /> 问答留言
            </h2>
            {localComments.length > 0 && (
              <div className="mb-4 space-y-3">
                {localComments.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar name={c.author} color={c.avatarColor} size={32} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{c.author}</span>
                        <span className="text-xs text-ink-muted">{c.date}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-ink-soft">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {user ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                  placeholder="写下你的问题或心得…"
                  className="field flex-1 text-sm"
                />
                <button onClick={addComment} disabled={!newComment.trim()} className="btn-primary px-4 disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">选家人后就能提问啦～</p>
            )}
          </div>
        </div>

        {/* sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <StepNavigator
            steps={tutorial.steps}
            current={current}
            learned={learned}
            onSelect={setCurrent}
            onPrev={() => setCurrent((i) => Math.max(0, i - 1))}
            onNext={() => setCurrent((i) => Math.min(tutorial.steps.length - 1, i + 1))}
          />

          {/* author card */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={tutorial.author} color={tutorial.avatarColor} size={44} />
              <div>
                <p className="font-medium text-ink">{tutorial.author}</p>
                <p className="text-xs text-ink-muted">{tutorial.authorRole}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              有问题就在下方提问，看到就会回复～
            </p>
          </div>

          {/* completion */}
          <div className={`card p-5 text-center transition ${allLearned ? "bg-miffy-soft/40" : ""}`}>
            <LogoMark className={`mx-auto h-12 w-12 ${allLearned ? "animate-floaty" : ""}`} cheek={allLearned} />
            <p className="mt-2 text-sm font-medium text-ink">
              {allLearned ? "全部学会啦！" : `还差 ${tutorial.steps.length - learned.filter(Boolean).length} 步`}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {allLearned ? "再复习一遍，或看看别的教程吧" : "一步步来，不着急～"}
            </p>
            {allLearned && (
              <Link to="/" className="btn-butter mt-3 w-full justify-center">看看别的</Link>
            )}
          </div>
        </aside>
      </div>

      {/* delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-xs rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e07a5f]/10">
              <Trash2 className="h-7 w-7 text-[#e07a5f]" />
            </div>
            <p className="text-lg font-bold text-ink">删除这篇教程？</p>
            <p className="mt-1 text-sm text-ink-muted">删除后不能恢复哦</p>
            <div className="mt-4">
              <input
                type="password"
                value={adminPwd}
                onChange={e => { setAdminPwd(e.target.value); setPwdError(false); }}
                placeholder="输入管理员密码"
                className="field text-center text-sm"
                autoFocus
              />
              {pwdError && <p className="mt-1.5 text-xs text-[#e07a5f]">管理员密码不对</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowDelete(false); setAdminPwd(""); setPwdError(false); }}
                className="btn-ghost flex-1 justify-center"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e07a5f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c0684a]"
              >
                <Trash2 className="h-4 w-4" /> 删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
