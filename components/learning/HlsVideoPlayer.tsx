"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsVideoPlayerProps {
  url: string;
  onEnded?: () => void;
  className?: string;
}

export function HlsVideoPlayer({ url, onEnded, className = "" }: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMarkedComplete = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !onEnded) return;

    // Wait until duration is valid and we haven't marked it yet
    if (video.duration > 0 && !hasMarkedComplete.current) {
      // If the video is shorter than 30 seconds, it will complete at the end
      if (video.duration > 30 && video.duration - video.currentTime <= 30) {
        hasMarkedComplete.current = true;
        onEnded();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let networkRetries = 0;

    if (Hls.isSupported()) {
      hls = new Hls({
        debug: false,
        enableWorker: true,
        // Bunny Stream might need high maxBufferLength
        maxBufferLength: 30,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover network error
              if (networkRetries < 3) {
                console.warn("fatal network error encountered, try to recover");
                networkRetries++;
                hls?.startLoad();
              } else {
                console.error("unrecoverable network error");
                hls?.destroy();
                setError("Network Error: Could not download video. If this is a Bunny.net stream, CORS might be blocking it.");
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("fatal media error encountered, try to recover");
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              setError("Fatal Error: Failed to play video.");
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native support (Safari)
      video.src = url;
      video.addEventListener("error", () => {
        setError("Failed to play video natively on this browser.");
      });
    } else {
      setError("Your browser does not support HLS video playback.");
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div className={`relative bg-black w-full h-full overflow-hidden ${className}`}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-6 text-center">
          <p className="text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        className="w-full h-full absolute inset-0 object-contain"
        onEnded={() => {
          if (!hasMarkedComplete.current && onEnded) {
            hasMarkedComplete.current = true;
            onEnded();
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        controlsList="nodownload"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}
