"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";
import { HlsVideoPlayer } from "./HlsVideoPlayer";

interface VideoPlayerProps {
  url: string;
  courseId: string;
  itemId: string;
  isCompleted: boolean;
}

export function VideoPlayer({ url, courseId, itemId, isCompleted }: VideoPlayerProps) {
  const [marking, setMarking] = useState(false);
  const [activeUrl, setActiveUrl] = useState(url);
  const prevBaseUrl = useRef(url.split("?")[0]);
  const router = useRouter();

  useEffect(() => {
    const currentBaseUrl = url.split("?")[0];
    if (currentBaseUrl !== prevBaseUrl.current) {
      prevBaseUrl.current = currentBaseUrl;
      setActiveUrl(url);
    }
  }, [url]);

  const markComplete = async () => {
    setMarking(true);
    try {
      await fetch(`/api/proxy/learning/courses/${courseId}/items/${itemId}/complete`, { method: "POST" });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex w-full flex-col bg-slate-950">
      <div className="relative flex aspect-video max-h-[62dvh] w-full items-center justify-center overflow-hidden bg-black">
        {activeUrl.includes("iframe.mediadelivery.net") ||
        activeUrl.includes("youtube.com/embed") ||
        activeUrl.includes("vimeo.com/video") ? (
          <iframe
            src={activeUrl}
            className="absolute left-0 top-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <HlsVideoPlayer
            url={activeUrl}
            onEnded={!isCompleted ? markComplete : undefined}
          />
        )}
      </div>

      <div className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                isCompleted ? "bg-[#52b788] text-[#06130d]" : "bg-white/10 text-white"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white">Learning Progress</h3>
              <p className="line-clamp-1 text-xs font-medium text-slate-400">
                {isCompleted ? "This video is complete." : "Complete the video automatically or mark it done."}
              </p>
            </div>
          </div>
          <button
            onClick={markComplete}
            disabled={isCompleted || marking}
            className={`inline-flex h-9 w-full flex-shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-extrabold transition sm:w-auto ${
              isCompleted
                ? "cursor-not-allowed bg-white/10 text-slate-400"
                : "bg-[#52b788] text-[#06130d] hover:bg-[#74c69d]"
            }`}
          >
            {marking ? <IconSpinner className="h-4 w-4 animate-spin" /> : null}
            {isCompleted ? "Completed" : marking ? "Marking..." : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
