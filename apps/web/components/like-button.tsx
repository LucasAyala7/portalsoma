"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface Props {
  mensagemId: string;
  initialCount?: number;
}

const STORAGE_KEY = "nivertotal:likes";

function readLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLiked(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

export function LikeButton({ mensagemId, initialCount = 0 }: Props) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setLiked(readLiked().has(mensagemId));
  }, [mensagemId]);

  function toggle() {
    const set = readLiked();
    const willUnlike = set.has(mensagemId);
    if (willUnlike) {
      set.delete(mensagemId);
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      set.add(mensagemId);
      setLiked(true);
      setCount((c) => c + 1);
    }
    writeLiked(set);
    navigator.sendBeacon?.(
      "/api/evento/",
      new Blob([JSON.stringify({ tipo: willUnlike ? "unlike" : "like", mensagemId })], {
        type: "application/json",
      }),
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost"
      aria-pressed={liked}
      aria-label={liked ? "Descurtir" : "Curtir"}
    >
      <Heart
        size={16}
        className={liked ? "fill-rose-500 text-rose-500" : ""}
        strokeWidth={2}
      />
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}
