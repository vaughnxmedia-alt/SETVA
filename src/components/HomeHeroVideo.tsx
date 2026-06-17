"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export const HERO_REPLAY_EVENT = "setva-hero-replay";
export const HERO_COPY_HIDE_EVENT = "setva-hero-copy-hide";
export const HERO_COPY_REVEAL_EVENT = "setva-hero-copy-reveal";

const MOBILE_SRC = "/setva-hero-mobile.mp4";
const DESKTOP_SRC = "/setva-hero-desktop.mp4";
const FADE_MS = 1400;
const FADE_START_BEFORE_END_S = FADE_MS / 1000;

function activeVideo(
  mobileRef: React.RefObject<HTMLVideoElement | null>,
  desktopRef: React.RefObject<HTMLVideoElement | null>,
): HTMLVideoElement | null {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  return isDesktop ? desktopRef.current : mobileRef.current;
}

function hideHeroCopy() {
  window.dispatchEvent(new CustomEvent(HERO_COPY_HIDE_EVENT));
}

function revealHeroCopy() {
  window.dispatchEvent(new CustomEvent(HERO_COPY_REVEAL_EVENT));
}

export function HomeHeroVideo() {
  const pathname = usePathname();
  const mobileRef = useRef<HTMLVideoElement>(null);
  const desktopRef = useRef<HTMLVideoElement>(null);
  const isFirstHomeVisit = useRef(true);
  const copyHiddenForReplay = useRef(false);
  const [videoVisible, setVideoVisible] = useState(true);

  const replayHero = useCallback((options?: { hideCopy?: boolean }) => {
    if (options?.hideCopy) {
      copyHiddenForReplay.current = true;
      hideHeroCopy();
    }

    setVideoVisible(true);
    const video = activeVideo(mobileRef, desktopRef);
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    void video.play().catch(() => {
      // Autoplay may be blocked until user interaction; ignore silently.
    });
  }, []);

  const beginVideoFade = useCallback(() => {
    setVideoVisible(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    beginVideoFade();
  }, [beginVideoFade]);

  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_START_BEFORE_END_S) {
        beginVideoFade();
      }
    },
    [beginVideoFade],
  );

  useEffect(() => {
    if (!videoVisible && copyHiddenForReplay.current) {
      copyHiddenForReplay.current = false;
      revealHeroCopy();
    }
  }, [videoVisible]);

  useEffect(() => {
    if (pathname !== "/") return;

    if (isFirstHomeVisit.current) {
      isFirstHomeVisit.current = false;
      replayHero();
      return;
    }

    replayHero({ hideCopy: true });
  }, [pathname, replayHero]);

  useEffect(() => {
    function onReplay() {
      replayHero({ hideCopy: true });
    }

    window.addEventListener(HERO_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(HERO_REPLAY_EVENT, onReplay);
  }, [replayHero]);

  const videoProps = {
    autoPlay: true,
    muted: true,
    playsInline: true,
    preload: "auto" as const,
    onEnded: handleVideoEnd,
    onTimeUpdate: handleTimeUpdate,
    "aria-hidden": true,
  };

  return (
    <>
      <Image
        src="/setva-hero-background.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
        aria-hidden
      />

      <div
        className={`hero-video-dissolve absolute inset-0 ${
          videoVisible ? "hero-video-dissolve--visible" : "hero-video-dissolve--hidden"
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <video
          ref={mobileRef}
          {...videoProps}
          className="absolute inset-0 h-full w-full object-cover md:hidden"
        >
          <source src={MOBILE_SRC} type="video/mp4" />
        </video>
        <video
          ref={desktopRef}
          {...videoProps}
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        >
          <source src={DESKTOP_SRC} type="video/mp4" />
        </video>
      </div>
    </>
  );
}

export function replayHomeHero() {
  window.dispatchEvent(new CustomEvent(HERO_REPLAY_EVENT));
}
