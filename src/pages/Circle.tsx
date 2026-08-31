import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, ImagePlus, X, Edit3, Trash2, Check } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { LogoMark } from "../components/Miffy";
import { useAuth } from "../lib/auth";

interface CirclePost {
  id: string;
  userId: string;
  authorName: string;
  authorColor: string;
  authorAvatar: string;
  text: string;
  images: string[];
  date: string;
  likes: string[];
  comments: CircleComment[];
}

interface CircleComment {
  id: string;
  userId: string;
  authorName: string;
  authorColor: string;
  text: string;
  date: string;
}

const KEY = "fth_circle_posts";

function loadPosts(): CirclePost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function savePosts(posts: CirclePost[]) {
  try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch { /* quota */ }
}

export function Circle() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CirclePost[]>(loadPosts);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { savePosts(posts); }, [posts]);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 9 - images.length;
    const toAdd = files.slice(0, remaining);
    const urls = await Promise.all(toAdd.map(fileToDataUrl));
    setImages(prev => [...prev, ...urls]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const publish = () => {
    if (!user) return;
    if (!text.trim() && images.length === 0) return;

    const post: CirclePost = {
      id: `p-${Date.now()}`,
      userId: user.id,
      authorName: user.name,
      authorColor: user.avatarColor,
      authorAvatar: user.avatar,
      text: text.trim(),
      images,
      date: new Date().toISOString().slice(0, 10),
      likes: [],
      comments: [],
    };
    setPosts(prev => [post, ...prev]);
    setText("");
    setImages([]);
  };

  const toggleLike = (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(user.id);
      return {
        ...p,
        likes: liked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id],
      };
    }));
  };

  const sendComment = (postId: string) => {
    if (!user) return;
    const c = (commentText[postId] ?? "").trim();
    if (!c) return;
    const comment: CircleComment = {
      id: `c-${Date.now()}`,
      userId: user.id,
      authorName: user.name,
      authorColor: user.avatarColor,
      text: c,
      date: new Date().toISOString().slice(0, 10),
    };
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    ));
    setCommentText(prev => ({ ...prev, [postId]: "" }));
  };

  const startEdit = (post: CirclePost) => {
    setEditingId(post.id);
    setEditText(post.text);
  };

  const saveEdit = (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, text: editText.trim() } : p
    ));
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setPosts(prev => prev.filter(p => p.id !== deleteTarget));
    setDeleteTarget(null);
  };

  return (
    <div className="page-enter container-app py-6">
      {/* header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">圈圈</h1>
          <p className="mt-1 text-sm text-ink-soft">家人的动态小广场，分享日常瞬间</p>
        </div>
        <LogoMark className="h-12 w-12 animate-floaty" cheek />
      </div>

      {/* post composer */}
      {user ? (
        <div className="card mb-6 p-5">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} size={40} />
            <span className="text-sm font-medium text-ink">{user.name}</span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="说点什么…"
            rows={3}
            className="field resize-none"
          />

          {/* image preview grid */}
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={img} alt={`图片${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= 9}
                className="flex items-center gap-1.5 rounded-full bg-cream-200 px-4 py-2 text-sm text-ink-soft transition hover:bg-cream-300 disabled:opacity-40"
              >
                <ImagePlus className="h-4 w-4" /> 图片
                <span className="text-xs text-ink-muted">{images.length}/9</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImages}
                className="hidden"
              />
            </div>
            <button
              onClick={publish}
              disabled={!text.trim() && images.length === 0}
              className="btn-primary disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> 发布
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-6 flex flex-col items-center gap-3 p-8 text-center">
          <LogoMark className="h-12 w-12" cheek />
          <p className="text-sm text-ink-muted">选家人后就能发动态啦～</p>
          <Link to="/members" className="btn-primary">去选家人</Link>
        </div>
      )}

      {/* feed */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <LogoMark className="h-16 w-16 animate-floaty" cheek />
          <div>
            <p className="text-lg font-medium text-ink">还没有动态</p>
            <p className="mt-1 text-sm text-ink-muted">发第一条，记录家里的美好瞬间～</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="card overflow-hidden p-5">
              {/* author + actions */}
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={post.authorName} color={post.authorColor} size={40} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{post.authorName}</p>
                  <p className="text-xs text-ink-muted">{post.date}</p>
                </div>
                {user && user.id === post.userId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(post)}
                      className="rounded-full p-1.5 text-ink-muted transition hover:bg-cream-200 hover:text-miffy"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(post.id)}
                      className="rounded-full p-1.5 text-ink-muted transition hover:bg-cream-200 hover:text-[#e07a5f]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* text or edit mode */}
              {editingId === post.id ? (
                <div className="mb-3 space-y-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="field resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => saveEdit(post.id)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" /> 保存
                    </button>
                  </div>
                </div>
              ) : (
                post.text && (
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{post.text}</p>
                )
              )}

              {/* images */}
              {post.images.length > 0 && (
                <div className={`mb-3 grid gap-1 ${
                  post.images.length === 1 ? "grid-cols-1" :
                  post.images.length <= 4 ? "grid-cols-2" :
                  "grid-cols-3"
                }`}>
                  {post.images.map((img, i) => (
                    <div key={i} className={`overflow-hidden rounded-xl ${
                      post.images.length === 1 ? "max-h-80" : "aspect-square"
                    }`}>
                      <img src={img} alt={`图片${i + 1}`} className={`h-full w-full object-cover ${
                        post.images.length === 1 ? "max-h-80" : ""
                      }`} />
                    </div>
                  ))}
                </div>
              )}

              {/* actions */}
              <div className="flex items-center gap-4 border-t border-wood/10 pt-3">
                <button
                  onClick={() => toggleLike(post.id)}
                  disabled={!user}
                  className={`flex items-center gap-1.5 text-sm transition disabled:opacity-40 ${
                    user && post.likes.includes(user.id) ? "text-miffy" : "text-ink-muted hover:text-miffy"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${user && post.likes.includes(user.id) ? "fill-miffy" : ""}`} />
                  {post.likes.length > 0 && post.likes.length}
                </button>
                <button
                  onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-miffy"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comments.length > 0 && post.comments.length}
                </button>
              </div>

              {/* comments */}
              {expandedComments === post.id && (
                <div className="mt-3 space-y-2 border-t border-wood/10 pt-3">
                  {post.comments.map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <Avatar name={c.authorName} color={c.authorColor} size={24} />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-ink">{c.authorName}</span>
                        <span className="ml-2 text-xs text-ink-soft">{c.text}</span>
                      </div>
                      <span className="text-[10px] text-ink-muted">{c.date}</span>
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[post.id] ?? ""}
                        onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") sendComment(post.id); }}
                        placeholder="写个评论…"
                        className="field flex-1 !py-2 text-sm"
                      />
                      <button onClick={() => sendComment(post.id)} className="btn-primary px-3">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-xs rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e07a5f]/10">
              <Trash2 className="h-7 w-7 text-[#e07a5f]" />
            </div>
            <p className="text-lg font-bold text-ink">删除这条动态？</p>
            <p className="mt-1 text-sm text-ink-muted">删除后不能恢复哦</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-ghost flex-1 justify-center"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
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
