import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, VideoOff, CircleDot, StopCircle } from "lucide-react";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
};

interface CallRoomProps {
  roomId: string;
}

export default function CallRoom({ roomId }: CallRoomProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Initialize socket
    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');
    const socket = socketRef.current;

    // 2. Setup WebRTC Peer Connection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: roomId,
          candidate: event.candidate,
        });
      }
    };

    // 3. Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 4. Join room
        const userId = Math.random().toString(36).substring(7);
        socket.emit('join-room', roomId, userId);
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
      });

    // Signaling handlers
    socket.on('user-connected', async (userId) => {
      // Create offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', {
          target: roomId,
          caller: socket.id,
          sdp: offer
        });
      } catch (err) {
        console.error('Error creating offer', err);
      }
    });

    socket.on('offer', async (payload) => {
      if (payload.caller !== socket.id) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', {
            target: roomId,
            caller: socket.id,
            sdp: answer
          });
        } catch (err) {
          console.error("Error handling offer", err);
        }
      }
    });

    socket.on('answer', async (payload) => {
      if (payload.caller !== socket.id) {
        try {
          if (pc.signalingState !== "stable") {
             await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        } catch (err) {
          console.error("Error setting remote answer", err);
        }
      }
    });

    socket.on('ice-candidate', async (payload) => {
      if (payload.userId !== socket.id) {
        try {
          if (payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (err) {
          console.error('Error adding ice candidate', err);
        }
      }
    });

    socket.on('user-disconnected', () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        setRemoteStream(null);
      }
    });

    return () => {
      socket.disconnect();
      pc.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]); // Added localStream dependency issue? No, it shouldn't recreate in strict mode.

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };

        if (localVideoRef.current) {
           localVideoRef.current.srcObject = screenStream;
        }

        const videoTrack = screenStream.getVideoTracks()[0];
        const pc = peerConnectionRef.current;
        if (pc) {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === videoTrack.kind);
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen sharing failed", err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
     if (localStream && localVideoRef.current) {
         localVideoRef.current.srcObject = localStream;
         const videoTrack = localStream.getVideoTracks()[0];
         const pc = peerConnectionRef.current;
         if (pc) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
               sender.replaceTrack(videoTrack);
            }
         }
         setIsScreenSharing(false);
     }
  };

  const startRecording = () => {
     try {
       const streamToRecord = remoteStream || localStream;
       if (!streamToRecord) return;
       
       const options = { mimeType: 'video/webm; codecs=vp9' };
       const mediaRecorder = new MediaRecorder(streamToRecord, options);
       
       mediaRecorderRef.current = mediaRecorder;
       recordedChunksRef.current = [];

       mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
             recordedChunksRef.current.push(event.data);
          }
       };

       mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.style.display = 'none';
          a.href = url;
          a.download = `YourTube_Session_${new Date().toISOString()}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          setRecordingTime(0);
       };

       mediaRecorder.start();
       setIsRecording(true);
       
       recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
       }, 1000);

     } catch (err) {
       console.error("Error starting recording", err);
     }
  };

  const stopRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
     }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const endCall = () => {
    window.location.href = "/";
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-zinc-950 overflow-hidden font-sans">
       {isRecording && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-500 rounded-full border border-red-500/50 animate-pulse font-medium text-sm">
             <CircleDot size={16} /> Recording {formatTime(recordingTime)}
          </div>
       )}

       <div className="relative flex-1 flex items-center justify-center p-4 gap-4">
           <div className="relative flex-1 h-full w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
              <video 
                 ref={remoteVideoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-full object-contain"
              />
              {!remoteStream && (
                 <div className="absolute inset-0 flex items-center justify-center flex-col text-neutral-400 gap-3">
                    <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center">
                       <VideoOff size={32} />
                    </div>
                    <p className="text-lg">Waiting for others to join...</p>
                 </div>
              )}
           </div>

           <div className="absolute bottom-24 right-8 w-48 h-64 bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/10 z-40 transition-transform hover:scale-105 cursor-move">
              <video 
                 ref={localVideoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 text-xs bg-black/80 px-2 py-1 rounded text-white font-medium">You</div>
           </div>
       </div>

       <div className="h-20 w-full bg-zinc-950/80 backdrop-blur-md flex items-center justify-center gap-4 px-6 fixed bottom-0 z-50 border-t border-white/5">
          <button 
             onClick={toggleMute} 
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
             {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <button 
             onClick={toggleVideo} 
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
             {isVideoOff ? <CameraOff size={22} /> : <Camera size={22} />}
          </button>

          <button 
             onClick={toggleScreenShare} 
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
             title="Share YouTube Screen"
          >
             <MonitorUp size={22} />
          </button>

          {!isRecording ? (
             <button 
                onClick={startRecording} 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white/10 text-white hover:bg-white/20"
                title="Start Recording Session"
             >
                <CircleDot size={22} className="text-red-400" />
             </button>
          ) : (
             <button 
                onClick={stopRecording} 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                title="Stop Recording"
             >
                <StopCircle size={22} />
             </button>
          )}

          <div className="w-px h-8 bg-neutral-800 mx-2"></div>

          <button 
             onClick={endCall} 
             className="w-16 h-12 rounded-full flex items-center justify-center transition-all bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          >
             <PhoneOff size={24} />
          </button>
       </div>
    </div>
  );
}
