"use client";

import { useRef, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import PremiumModal from "./PremiumModal";
import { useRouter } from "next/router";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  allVideos?: any[];
}

export default function VideoPlayer({ video, allVideos }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const [visualFeedback, setVisualFeedback] = useState<string | null>(null);

  // Gesture State Refs
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);
  const lastZoneRef = useRef<'left' | 'center' | 'right' | null>(null);

  // Time limits in seconds based on plan
  const getLimitInSeconds = (plan: string) => {
    switch (plan) {
      case 'Bronze': return 7 * 60;
      case 'Silver': return 10 * 60;
      case 'Gold': return Infinity;
      case 'Free':
      default: return 5 * 60;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentPlan = user?.plan || 'Free';
    const limit = getLimitInSeconds(currentPlan);

    if (videoRef.current.currentTime >= limit) {
      videoRef.current.pause();
      setShowPaywall(true);
      if (videoRef.current.currentTime > limit + 1) {
         videoRef.current.currentTime = limit;
      }
    }
  };

  const executeVisualFeedback = (message: string) => {
    setVisualFeedback(message);
    setTimeout(() => setVisualFeedback(null), 800);
  };

  const getZoneFromPointer = (clientX: number, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    let zone: 'left' | 'center' | 'right' = 'center';
    if (x < width * 0.33) zone = 'left';
    else if (x > width * 0.66) zone = 'right';

    return zone;
  };

  const goToNextVideo = () => {
    if (!allVideos?.length) {
      executeVisualFeedback("No next video");
      return;
    }

    const currentIndex = allVideos.findIndex((item) => item._id === video._id);
    const nextVideo = allVideos[(currentIndex + 1) % allVideos.length];

    if (!nextVideo || nextVideo._id === video._id) {
      executeVisualFeedback("No next video");
      return;
    }

    executeVisualFeedback("Next Video");
    setTimeout(() => router.push(`/watch/${nextVideo._id}`), 300);
  };

  const closeWebsite = () => {
    executeVisualFeedback("Closing Website");
    const attemptClose = () => {
      try {
        window.open("", "_self");
      } catch (error) {
        console.warn("Self-close preparation failed", error);
      }

      try {
        window.close();
      } catch (error) {
        console.warn("Window close failed", error);
      }

      setTimeout(() => {
        if (!window.closed) {
          window.location.replace("about:blank");
        }
      }, 250);
    };

    setTimeout(attemptClose, 150);
  };

  const openComments = () => {
    executeVisualFeedback("Opening Comments");
    const commentSection = document.getElementById("comments-section");
    if (commentSection) {
      commentSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGestureTap = (clientX: number, container: HTMLDivElement) => {
    const zone = getZoneFromPointer(clientX, container);

    if (lastZoneRef.current !== zone) {
      clickCountRef.current = 0;
      lastZoneRef.current = zone;
    }

    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      const count = clickCountRef.current;
      clickCountRef.current = 0;
      lastZoneRef.current = null;

      if (count === 1 && zone === "center" && videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          executeVisualFeedback("Play");
        } else {
          videoRef.current.pause();
          executeVisualFeedback("Pause");
        }
        return;
      }

      if (count === 2 && videoRef.current) {
        if (zone === "left") {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          executeVisualFeedback("-10s");
          return;
        }

        if (zone === "right") {
          const duration = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : videoRef.current.currentTime + 10;
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          executeVisualFeedback("+10s");
          return;
        }
      }

      if (count >= 3) {
        if (zone === "left") {
          openComments();
          return;
        }

        if (zone === "center") {
          goToNextVideo();
          return;
        }

        if (zone === "right") {
          closeWebsite();
        }
      }
    }, 260);
  };

  const handleZoneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleGestureTap(e.clientX, e.currentTarget);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    handleGestureTap(touch.clientX, e.currentTarget);
  };

  return (
    <>
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
        
        {/* Invisible gesture overlay sitting above video, letting bottom 15% clear for natural seek bar clicks */}
        <div 
           className="absolute top-0 left-0 right-0 bottom-[15%] z-10 cursor-pointer"
           onClick={handleZoneClick}
           onTouchEnd={handleTouchEnd}
           onDoubleClick={(e) => e.preventDefault()} // prevent natural zoom on double tap
        />

        {visualFeedback && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse whitespace-nowrap pointer-events-none">
               {visualFeedback}
            </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls
          onTimeUpdate={handleTimeUpdate}
          poster={`/placeholder.svg?height=480&width=854`}
        >
          <source
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${video?.filepath}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        
        {showPaywall && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center z-30 pointer-events-none">
              <h3 className="text-2xl font-bold mb-2">Watch Limit Reached</h3>
              <p className="text-gray-300">Your current plan limits you to {Math.floor(getLimitInSeconds(user?.plan || 'Free')/60)} minutes per video.</p>
           </div>
        )}
      </div>

      <PremiumModal 
        isOpen={showPaywall} 
        onClose={() => {
            setShowPaywall(false);
            if (videoRef.current) {
                videoRef.current.currentTime = getLimitInSeconds(user?.plan || 'Free') - 1;
            }
        }} 
      />
    </>
  );
}
