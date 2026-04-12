"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Camera,
  CameraOff,
  CircleDot,
  Copy,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  StopCircle,
  VideoOff,
} from "lucide-react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface CallRoomProps {
  roomId: string;
}

const getSupportedMimeType = () => {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
};

export default function CallRoom({ roomId }: CallRoomProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [displayStream, setDisplayStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Start by sharing the room link with a friend.");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isMountedRef = useRef(true);
  const selfIdRef = useRef(`user_${Math.random().toString(36).slice(2, 9)}`);

  const attachLocalPreview = (stream: MediaStream | null) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const attachRemotePreview = (stream: MediaStream | null) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const stopStreamTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const updateVideoSenderTrack = async (track: MediaStreamTrack | null) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    const sender = peerConnection.getSenders().find((item) => item.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(track);
    }
  };

  const buildRecordingStream = () => {
    const composite = new MediaStream();
    const activeLocalStream = displayStreamRef.current || localStreamRef.current;

    activeLocalStream?.getVideoTracks().forEach((track) => composite.addTrack(track.clone()));
    localStreamRef.current?.getAudioTracks().forEach((track) => composite.addTrack(track.clone()));
    remoteStreamRef.current?.getAudioTracks().forEach((track) => composite.addTrack(track.clone()));
    remoteStreamRef.current?.getVideoTracks().forEach((track) => {
      if (composite.getVideoTracks().length === 0) {
        composite.addTrack(track.clone());
      }
    });

    return composite;
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initializeCall = async () => {
      try {
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000");
        socketRef.current = socket;

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = peerConnection;

        peerConnection.ontrack = (event) => {
          const [incomingStream] = event.streams;
          if (!incomingStream) return;
          remoteStreamRef.current = incomingStream;
          setRemoteStream(incomingStream);
          attachRemotePreview(incomingStream);
          setStatusMessage("Connected. You can chat, share your screen, or record the session.");
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              senderId: selfIdRef.current,
            });
          }
        };

        peerConnection.onnegotiationneeded = async () => {
          try {
            makingOfferRef.current = true;
            const offer = await peerConnection.createOffer();
            if (peerConnection.signalingState !== "stable") return;
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", {
              senderId: selfIdRef.current,
              sdp: peerConnection.localDescription,
            });
          } catch (error) {
            console.error("Negotiation failed", error);
          } finally {
            makingOfferRef.current = false;
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMountedRef.current) {
          stopStreamTracks(stream);
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        attachLocalPreview(stream);

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        socket.emit("join-room", roomId, selfIdRef.current);
        setStatusMessage("Waiting for your friend to join this call.");

        socket.on("user-connected", (userId) => {
          if (userId !== selfIdRef.current) {
            setStatusMessage("Another user joined. Setting up your video call.");
          }
        });

        socket.on("offer", async (payload) => {
          if (payload.senderId === selfIdRef.current) return;

          const offerCollision =
            makingOfferRef.current || peerConnection.signalingState !== "stable";
          ignoreOfferRef.current = offerCollision;
          if (offerCollision) return;

          try {
            await peerConnection.setRemoteDescription(payload.sdp);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", {
              senderId: selfIdRef.current,
              sdp: peerConnection.localDescription,
            });
          } catch (error) {
            console.error("Error handling offer", error);
          }
        });

        socket.on("answer", async (payload) => {
          if (payload.senderId === selfIdRef.current) return;

          try {
            if (peerConnection.signalingState === "have-local-offer") {
              await peerConnection.setRemoteDescription(payload.sdp);
            }
          } catch (error) {
            console.error("Error applying answer", error);
          }
        });

        socket.on("ice-candidate", async (payload) => {
          if (payload.senderId === selfIdRef.current || ignoreOfferRef.current) return;

          try {
            if (payload.candidate) {
              await peerConnection.addIceCandidate(payload.candidate);
            }
          } catch (error) {
            console.error("Error adding ICE candidate", error);
          }
        });

        socket.on("user-disconnected", (userId) => {
          if (userId !== selfIdRef.current) {
            remoteStreamRef.current = null;
            setRemoteStream(null);
            attachRemotePreview(null);
            setStatusMessage("Your friend left the call. Share the link again to reconnect.");
          }
        });
      } catch (error) {
        console.error("Failed to initialize call", error);
        setStatusMessage("Camera or microphone access was blocked. Please allow media permissions and retry.");
      }
    };

    initializeCall();

    return () => {
      isMountedRef.current = false;
      socketRef.current?.disconnect();
      peerConnectionRef.current?.close();
      stopStreamTracks(localStreamRef.current);
      stopStreamTracks(displayStreamRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
    };
  }, [roomId]);

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOff(!videoTrack.enabled);
  };

  const stopScreenSharing = async () => {
    stopStreamTracks(displayStreamRef.current);
    displayStreamRef.current = null;
    setDisplayStream(null);

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    await updateVideoSenderTrack(cameraTrack);
    attachLocalPreview(localStreamRef.current);
    setIsScreenSharing(false);
    setStatusMessage("Returned to camera sharing.");
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenSharing();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        } as MediaTrackConstraints,
        audio: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrack.onended = () => {
        stopScreenSharing().catch((error) => console.error("Screen share cleanup failed", error));
      };

      displayStreamRef.current = screenStream;
      setDisplayStream(screenStream);
      attachLocalPreview(screenStream);
      await updateVideoSenderTrack(screenTrack);
      setIsScreenSharing(true);
      setStatusMessage("Screen sharing is live. Choose the YouTube tab in the browser picker to co-watch together.");
    } catch (error) {
      console.error("Screen sharing failed", error);
      setStatusMessage("Screen sharing was cancelled or blocked.");
    }
  };

  const startRecording = () => {
    try {
      const recordingStream = buildRecordingStream();
      if (!recordingStream.getTracks().length) {
        setStatusMessage("Nothing is available to record yet.");
        return;
      }

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(recordingStream, { mimeType })
        : new MediaRecorder(recordingStream);

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `YourTube_Call_${roomId}_${new Date().toISOString()}.webm`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        recordingStream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
        setStatusMessage("Recording saved locally to your device.");
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setStatusMessage("Recording started. The session will download locally when you stop.");
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (error) {
      console.error("Recording failed", error);
      setStatusMessage("Recording is not supported by this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Call link copied. Send it to your friend to join instantly.");
    } catch (error) {
      console.error("Copy failed", error);
      setStatusMessage("Copy failed. You can still share the URL from the address bar.");
    }
  };

  const endCall = () => {
    stopRecording();
    stopScreenSharing().catch(() => undefined);
    window.location.href = "/";
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-sans text-white">
      {isRecording && (
        <div className="absolute left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-500">
          <CircleDot size={16} /> Recording {formatTime(recordingTime)}
        </div>
      )}

      <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Room</p>
          <p className="text-sm font-semibold">{roomId}</p>
        </div>
        <button
          onClick={copyInviteLink}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          title="Copy call invite link"
        >
          <Copy size={18} />
        </button>
      </div>

      <div className="relative flex-1 p-4 pb-28">
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-contain" />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-neutral-900">
                  <VideoOff size={32} />
                </div>
                <p className="text-lg">Waiting for your friend to join the call...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative min-h-[240px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold">
                {isScreenSharing ? "Your screen" : "You"}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h2 className="text-lg font-semibold">Live Collaboration</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{statusMessage}</p>
              <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-100">
                To co-watch YouTube, click screen share and choose the browser tab that already has YouTube open.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 z-50 flex h-20 w-full items-center justify-center gap-4 border-t border-white/5 bg-zinc-950/85 px-6 backdrop-blur-md">
        <button
          onClick={toggleMute}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {isVideoOff ? <CameraOff size={22} /> : <Camera size={22} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isScreenSharing
              ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-600"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Share your screen or a YouTube tab"
        >
          <MonitorUp size={22} />
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            title="Record the current session locally"
          >
            <CircleDot size={22} className="text-red-400" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition hover:bg-red-600"
            title="Stop recording"
          >
            <StopCircle size={22} />
          </button>
        )}

        <div className="mx-2 h-8 w-px bg-neutral-800" />

        <button
          onClick={endCall}
          className="flex h-12 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-700"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
