import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import type { Comment } from "../types";
import { Avatar } from "./Avatar";

interface Props {
  comments: Comment[];
  stepTitle?: string;
}

export function CommentThread({ comments, stepTitle }: Props) {
  const [text, setText] = useState("");
  const [list, setList] = useState(comments);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setList([
      ...list,
      {
        id: `c-new-${Date.now()}`,
        author: "我",
        avatarColor: "#E08A2A",
        text: text.trim(),
        date: "刚刚",
        replies: [],
      },
    ]);
    setText("");
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-miffy" />
        <h2 className="text-lg font-semibold text-ink">提问与讨论</h2>
        {stepTitle && (
          <span className="ml-auto rounded-full bg-cream-200 px-3 py-1 text-xs text-ink-soft">
            关于「{stepTitle}」
          </span>
        )}
      </div>

      <div className="space-y-5">
        {list.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-muted">
            还没有提问，有不懂的地方尽管问～
          </p>
        )}
        {list.map((c) => (
          <div key={c.id} className="space-y-3">
            <div className="flex gap-3">
              <Avatar name={c.author} color={c.avatarColor} size={32} />
              <div className="flex-1">
                <div className="rounded-2xl rounded-tl-sm bg-cream-200/70 px-4 py-2.5">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{c.author}</span>
                    <span className="text-[11px] text-ink-muted">{c.date}</span>
                  </div>
                  <p className="text-sm text-ink-soft">{c.text}</p>
                </div>
              </div>
            </div>
            {c.replies.map((r) => (
              <div key={r.id} className="ml-11 flex gap-3">
                <Avatar name={r.author} color="#E08A2A" size={28} />
                <div className="flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-miffy-soft/60 px-4 py-2.5">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-sm font-medium text-miffy-dark">{r.author}</span>
                      {r.isAuthor && (
                        <span className="rounded-full bg-miffy px-2 py-0.5 text-[10px] text-white">作者</span>
                      )}
                      <span className="text-[11px] text-ink-muted">{r.date}</span>
                    </div>
                    <p className="text-sm text-ink">{r.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写下你的问题…"
          className="field"
        />
        <button type="submit" className="btn-primary shrink-0" disabled={!text.trim()}>
          <Send className="h-4 w-4" /> 发送
        </button>
      </form>
    </section>
  );
}
