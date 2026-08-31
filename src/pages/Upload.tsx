import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ChevronLeft, ChevronRight, ImagePlus, Check, X, Video, FileText, Save } from "lucide-react";
import { categories } from "../data/tutorials";
import { LogoMark } from "../components/Miffy";
import { useSettings } from "../lib/settings";
import { useAuth } from "../lib/auth";
import { loadDrafts, saveDraft, deleteDraft, type TutorialDraft, type DraftStep } from "../lib/drafts";
import { addUserTutorial, getUserTutorial, buildStepsFromDraft, type UserTutorial } from "../lib/tutorialStore";
import { isCosReady, uploadImageFromBase64, uploadFile, uploadVideo } from "../lib/cosUpload";

const emptyStep = (): DraftStep => ({
  id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: "",
  text: "",
  img: null,
  video: null,
});

const wizard = ["基本信息", "添加步骤", "预览发布"];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function Upload() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  const [step, setStep] = useState(0);
  const [cover, setCover] = useState<string | null>(null);
  const [coverVideo, setCoverVideo] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("美食");
  const [tags, setTags] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([emptyStep()]);
  const [done, setDone] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [editingDraft, setEditingDraft] = useState<TutorialDraft | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load existing tutorial for editing
  useEffect(() => {
    if (!editId) return;
    const existing = getUserTutorial(editId);
    if (existing) {
      setIsEditMode(true);
      setCover(existing.coverPrompt || null);
      setCoverVideo(existing.steps.find(s => s.video)?.video || null);
      setTitle(existing.title);
      setCategory(existing.category);
      setTags(existing.tags.join(" · "));
      setSteps(existing.steps.map(s => ({
        id: s.id,
        title: s.title,
        text: s.text,
        img: s.imagePrompt || null,
        video: s.video || null,
      })));
    }
  }, [editId]);

  const pickFile = (cb: (file: File) => void, accept = "image/*") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) cb(f);
    };
    input.click();
  };

  const updateStep = (id: string, patch: Partial<DraftStep>) =>
    setSteps(arr => arr.map(s => (s.id === id ? { ...s, ...patch } : s)));

  // upload cover image to COS or fall back to base64
  const handleCoverImage = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    if (isCosReady()) {
      const cosUrl = await uploadImageFromBase64(dataUrl);
      setCover(cosUrl ?? dataUrl);
    } else {
      setCover(dataUrl);
    }
  };

  // upload cover video to COS or fall back to object URL
  const handleCoverVideo = async (file: File) => {
    if (isCosReady()) {
      const cosUrl = await uploadVideo(file);
      setCoverVideo(cosUrl ?? URL.createObjectURL(file));
    } else {
      setCoverVideo(URL.createObjectURL(file));
    }
  };

  // upload step image to COS or fall back to base64
  const handleStepImage = async (id: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    if (isCosReady()) {
      const cosUrl = await uploadImageFromBase64(dataUrl);
      updateStep(id, { img: cosUrl ?? dataUrl });
    } else {
      updateStep(id, { img: dataUrl });
    }
  };

  // upload step video to COS or fall back to object URL
  const handleStepVideo = async (id: string, file: File) => {
    if (isCosReady()) {
      const cosUrl = await uploadVideo(file);
      updateStep(id, { video: cosUrl ?? URL.createObjectURL(file) });
    } else {
      updateStep(id, { video: URL.createObjectURL(file) });
    }
  };

  const canNext =
    step === 0 ? title.trim() : step === 1 ? steps.length && steps.every(s => s.text.trim()) : true;

  // auto-save draft
  const autoSave = useCallback(() => {
    if (!user) return;
    const id = draftId ?? `d-${Date.now()}`;
    const draft: TutorialDraft = {
      id,
      userId: user.id,
      cover,
      coverVideo,
      title: title.trim(),
      category,
      tags,
      steps,
      updatedAt: new Date().toISOString(),
    };
    saveDraft(draft);
    setDraftId(id);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 1500);
  }, [user, draftId, cover, coverVideo, title, category, tags, steps]);

  useEffect(() => {
    if (!user || done || isEditMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(autoSave, 2000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cover, coverVideo, title, category, tags, steps, user, done, isEditMode, autoSave]);

  const myDrafts = user ? loadDrafts(user.id) : [];

  const loadDraft = (d: TutorialDraft) => {
    setDraftId(d.id);
    setCover(d.cover);
    setCoverVideo(d.coverVideo);
    setTitle(d.title);
    setCategory(d.category);
    setTags(d.tags);
    setSteps(d.steps.length ? d.steps : [emptyStep()]);
    setEditingDraft(d);
    setStep(0);
  };

  const publish = () => {
    if (!user) return;
    const id = editId ?? `ut-${Date.now()}`;
    const tutorial: UserTutorial = {
      id,
      title: title.trim(),
      category: category as any,
      coverPrompt: cover || "",
      coverSize: "landscape_16_9",
      tags: tags.split(/[·、]/).map(t => t.trim()).filter(Boolean),
      author: user.name,
      authorRole: "家人",
      avatarColor: user.avatarColor,
      date: new Date().toISOString().slice(0, 10),
      intro: steps[0]?.text?.slice(0, 80) || title.trim(),
      steps: buildStepsFromDraft(steps),
      comments: [],
      likes: 0,
      isUserCreated: true,
      userId: user.id,
    };
    // preserve cover video in first step if exists
    if (coverVideo) {
      tutorial.steps[0] = { ...tutorial.steps[0], video: coverVideo };
    }
    addUserTutorial(tutorial);
    // delete the draft if one was associated
    if (draftId) deleteDraft(draftId);
    setDone(true);
  };

  if (done) {
    return (
      <div className="page-enter container-app flex flex-col items-center gap-5 py-20 text-center">
        <LogoMark className="h-20 w-20 animate-floaty" cheek />
        <h1 className="text-2xl font-bold text-ink">{isEditMode ? "教程已更新！" : "教程已发布！"}</h1>
        <p className="max-w-md text-sm text-ink-soft">
          「{title}」{isEditMode ? "已更新" : "已发布"}，家人现在就能看到啦。
        </p>
        <div className="flex gap-3">
          <Link to={`/tutorial/${editId ?? `ut-${Date.now()}`}`} className="btn-primary">
            查看教程
          </Link>
          <button
            onClick={() => {
              setDone(false); setStep(0); setCover(null); setCoverVideo(null);
              setTitle(""); setTags(""); setSteps([emptyStep()]);
              setDraftId(null); setEditingDraft(null); setIsEditMode(false);
            }}
            className="btn-ghost"
          >
            再发一篇
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter container-app max-w-3xl py-6">
      <h1 className="mb-1 text-2xl font-bold text-ink">
        {isEditMode ? "编辑教程" : "上传新教程"}
      </h1>
      <p className="mb-6 text-sm text-ink-soft">
        {isEditMode ? "修改内容后重新发布即可。" : "把你会的，一点点教给家人。封面和视频都是可选的。"}
      </p>

      {/* auto-save indicator */}
      {draftSaved && (
        <div className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-sage px-4 py-2 text-sm text-white shadow-lg">
          <Save className="h-3.5 w-3.5" /> 草稿已自动保存
        </div>
      )}

      {/* existing drafts */}
      {myDrafts.length > 0 && !editingDraft && step === 0 && !isEditMode && (
        <div className="card mb-4 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
            <FileText className="h-4 w-4 text-miffy" /> 你的草稿（{myDrafts.length}）
          </p>
          <div className="space-y-2">
            {myDrafts.map(d => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl bg-cream-50 p-2.5">
                <button onClick={() => loadDraft(d)} className="flex flex-1 items-center gap-3 text-left">
                  {d.cover ? (
                    <img src={d.cover} alt="" className="h-10 w-14 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-cream-200">
                      <ImagePlus className="h-4 w-4 text-ink-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{d.title || "未命名草稿"}</p>
                    <p className="text-xs text-ink-muted">{d.steps.length} 步 · {d.updatedAt.slice(0, 16)}</p>
                  </div>
                </button>
                <button
                  onClick={() => { deleteDraft(d.id); window.location.reload(); }}
                  className="rounded-lg p-1.5 text-ink-muted hover:bg-cream-200 hover:text-miffy"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* wizard progress */}
      <div className="mb-6 flex items-center gap-2">
        {wizard.map((w, i) => (
          <div key={w} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                i <= step ? "bg-miffy text-white" : "bg-cream-200 text-ink-muted"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i <= step ? "font-medium text-ink" : "text-ink-muted"}`}>{w}</span>
            {i < wizard.length - 1 && <div className="mx-1 h-px flex-1 bg-wood/25" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* step 1: basic info */}
        {step === 0 && (
          <div className="space-y-5">
            {/* cover - optional, image or video */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">封面（可选）</label>
              <div className="flex gap-3">
                <button
                  onClick={() => pickFile(handleCoverImage)}
                  className="upload-zone h-44 flex-1"
                >
                  {cover ? (
                    <img src={cover} alt="封面预览" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImagePlus className="h-7 w-7 text-ink-muted" />
                      <span className="mt-2 text-sm text-ink-soft">上传封面图（可选）</span>
                    </div>
                  )}
                </button>
                {cover && (
                  <button onClick={() => setCover(null)} className="rounded-full bg-cream-200 p-2 text-ink-muted hover:text-miffy">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* cover video - optional */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">封面视频（可选）</label>
              <div className="flex gap-3">
                <button
                  onClick={() => pickFile(handleCoverVideo, "video/*")}
                  className="upload-zone h-32 flex-1"
                >
                  {coverVideo ? (
                    <video src={coverVideo} controls className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Video className="h-6 w-6 text-ink-muted" />
                      <span className="mt-2 text-sm text-ink-soft">上传封面视频（可选）</span>
                    </div>
                  )}
                </button>
                {coverVideo && (
                  <button onClick={() => setCoverVideo(null)} className="rounded-full bg-cream-200 p-2 text-ink-muted hover:text-miffy">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">标题</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="比如：家常拿手菜合集" className="field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">分类</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="field">
                  {categories.filter(c => c !== "全部").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {settings.customCategories.map(c => (
                    <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">标签</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="用 · 分隔，如 入门 · 家常菜" className="field" />
              </div>
            </div>
          </div>
        )}

        {/* step 2: steps */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">步骤列表</h2>
              <button onClick={() => setSteps(a => [...a, emptyStep()])} className="btn-butter px-3.5 py-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> 添加步骤
              </button>
            </div>
            {steps.map((s, i) => (
              <div key={s.id} className="rounded-2xl border border-wood/20 bg-cream-50/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="chip bg-miffy text-white">步骤 {i + 1}</span>
                  <input value={s.title} onChange={e => updateStep(s.id, { title: e.target.value })} placeholder="步骤小标题" className="field !py-2 !px-3 text-sm" />
                  {steps.length > 1 && (
                    <button onClick={() => setSteps(a => a.filter(x => x.id !== s.id))} className="ml-auto rounded-full p-2 text-ink-muted hover:bg-cream-200 hover:text-miffy" aria-label="删除步骤">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => pickFile(f => handleStepImage(s.id, f))} className="upload-zone h-28">
                      {s.img ? (
                        <img src={s.img} alt="步骤图" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImagePlus className="h-5 w-5 text-ink-muted" />
                          <span className="text-xs text-ink-soft">步骤图</span>
                        </div>
                      )}
                    </button>
                    <button onClick={() => pickFile(f => handleStepVideo(s.id, f), "video/*")} className="upload-zone h-20">
                      {s.video ? (
                        <video src={s.video} controls className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Video className="h-4 w-4 text-ink-muted" />
                          <span className="text-xs text-ink-soft">步骤视频</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <textarea value={s.text} onChange={e => updateStep(s.id, { text: e.target.value })} placeholder="写下这一步的操作要点…" rows={4} className="field resize-none" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* step 3: preview */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl bg-cream-200">
              {cover ? (
                <img src={cover} alt="封面" className="h-44 w-full object-cover" />
              ) : coverVideo ? (
                <video src={coverVideo} controls className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-ink-muted">未上传封面（也可以发布）</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-ink">{title || "（未填标题）"}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="chip-active">{category}</span>
              {tags.split("·").map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="chip-outline">#{t}</span>
              ))}
              <span className="chip-outline">共 {steps.length} 步</span>
            </div>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s.id} className="flex gap-3 rounded-2xl bg-cream-50/60 p-3">
                  <span className="chip bg-miffy/90 text-white">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{s.title || `步骤 ${i + 1}`}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{s.text || "（未填说明）"}</p>
                    {s.img && <img src={s.img} alt="" className="mt-2 h-24 w-32 rounded-lg object-cover" />}
                    {s.video && <video src={s.video} controls className="mt-2 h-24 w-32 rounded-lg object-cover" />}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* actions */}
        <div className="mt-6 flex items-center justify-between border-t border-wood/15 pt-5">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> 上一步
          </button>
          {step < 2 ? (
            <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} className="btn-primary">
              下一步 <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              {!isEditMode && (
                <button onClick={autoSave} className="btn-ghost">
                  <Save className="h-4 w-4" /> 存草稿
                </button>
              )}
              <button onClick={publish} className="btn-primary">
                <Check className="h-4 w-4" /> {isEditMode ? "更新发布" : "发布"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
        <LogoMark className="h-5 w-5" />
        <span>{isEditMode ? "编辑模式不自动存草稿。" : "草稿会自动保存，随时可以回来继续编辑。"}</span>
      </div>
    </div>
  );
}
