"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const TTS_VOICE = "nova";

export default function VoiceButton({ text, token }: { text: string; token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const modeRef = useRef<"server" | "browser" | null>(null);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopCurrent = (nextState: "idle" | "loading" = "idle") => {
    cleanupAudio();
    window.speechSynthesis.cancel();
    modeRef.current = null;
    setState(nextState);
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      window.speechSynthesis.cancel();
    };
  }, []);

  const decodeAudio = (audioB64: string, contentType: string) => {
    const binary = atob(audioB64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    return new Blob([buffer], { type: contentType || "audio/mpeg" });
  };

  const pickRussianVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Microsoft Svetlana Online",
      "Microsoft Dmitry Online",
      "Google русский",
      "Yandex",
      "Svetlana",
      "Dmitry",
      "Milena",
    ];

    return (
      preferred.map(name => voices.find(voice => voice.name.includes(name))).find(Boolean) ||
      voices.find(voice => voice.lang === "ru-RU") ||
      voices.find(voice => voice.lang.startsWith("ru"))
    );
  };

  const playBrowserFallback = () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utter.lang = "ru-RU";
    utter.rate = 0.95;
    utter.pitch = 1.02;

    const ruVoice = pickRussianVoice();
    if (ruVoice) utter.voice = ruVoice;

    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");
    modeRef.current = "browser";
    window.speechSynthesis.speak(utter);
    setState("playing");
  };

  const play = async () => {
    stopCurrent("loading");

    try {
      const res = await fetch(`${API_URL}/api/audio/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.slice(0, 4096), voice: TTS_VOICE }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.audio_b64) throw new Error("No audio data");

      const blob = decodeAudio(data.audio_b64, data.content_type);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      objectUrlRef.current = url;
      audioRef.current = audio;
      modeRef.current = "server";
      audio.onended = () => stopCurrent();
      audio.onerror = () => stopCurrent();

      await audio.play();
      setState("playing");
    } catch {
      stopCurrent();
      playBrowserFallback();
    }
  };

  const pause = () => {
    if (modeRef.current === "server" && audioRef.current) audioRef.current.pause();
    else window.speechSynthesis.pause();
    setState("paused");
  };

  const resume = () => {
    if (modeRef.current === "server" && audioRef.current) {
      audioRef.current.play().catch(() => setState("idle"));
    } else {
      window.speechSynthesis.resume();
    }
    setState("playing");
  };

  const stop = () => stopCurrent();

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {state === "idle" && (
        <button onClick={play} className="flex items-center gap-1 text-text/20 hover:text-accent transition-colors" title="Озвучить">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <span className="text-[10px]">Озвучить</span>
        </button>
      )}
      {state === "loading" && (
        <button disabled className="flex items-center gap-1 text-accent/60 transition-colors" title="Готовим озвучку">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 109 9" />
          </svg>
          <span className="text-[10px]">Озвучка...</span>
        </button>
      )}
      {state === "playing" && (
        <>
          <button onClick={pause} className="flex items-center gap-1 text-accent" title="Пауза">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            <span className="text-[10px]">Пауза</span>
          </button>
          <button onClick={stop} className="text-text/30 hover:text-red-400 transition-colors" title="Стоп">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <div className="flex items-end gap-[2px] h-3 ml-1">
            {[2,4,6,3,5,7,4,3,5,6].map((h,i) => (
              <div key={i} className="w-[2px] bg-accent/50 rounded-full" style={{ height: `${h * 1.5}px`, animation: `waveRec 0.4s ${i*0.04}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        </>
      )}
      {state === "paused" && (
        <>
          <button onClick={resume} className="flex items-center gap-1 text-accent/60 hover:text-accent transition-colors" title="Продолжить">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
            <span className="text-[10px]">Продолжить</span>
          </button>
          <button onClick={stop} className="text-text/30 hover:text-red-400 transition-colors" title="Стоп">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
        </>
      )}
    </div>
  );
}
