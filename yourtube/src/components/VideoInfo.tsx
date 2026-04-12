import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import PremiumModal from "./PremiumModal";
import axiosInstance from "@/lib/axiosinstance";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(1200000);
  const channelName = video?.videochanel;

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!channelName) return;

      try {
        const res = await axiosInstance.get("/user/subscription-status", {
          params: { channelName },
        });
        setIsSubscribed(Boolean(res.data.subscribed));
        setSubscriberCount(Number(res.data.subscriberCount || 0));
      } catch (error) {
        console.log(error);
      }
    };

    fetchSubscriptionStatus();
  }, [channelName, user?._id]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);
  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
        action: "like",
      });
      setIsLiked(Boolean(res.data.liked));
      setIsDisliked(Boolean(res.data.disliked));
      setlikes((prev: any) => prev + (res.data.liked ? (isLiked ? 0 : 1) : (isLiked ? -1 : 0)));
      if (isDisliked) {
        setDislikes((prev: any) => prev - (res.data.liked ? 1 : 0));
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
        action: "dislike",
      });
      setIsDisliked(Boolean(res.data.disliked));
      setIsLiked(Boolean(res.data.liked));
      setDislikes((prev: any) => prev + (res.data.disliked ? (isDisliked ? 0 : 1) : (isDisliked ? -1 : 0)));
      if (isLiked) {
        setlikes((prev: any) => prev - (res.data.disliked ? 1 : 0));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please sign in to subscribe");
      return;
    }

    try {
      const res = await axiosInstance.post("/user/toggle-subscription", {
        channelName,
      });
      setIsSubscribed(Boolean(res.data.subscribed));
      setSubscriberCount(Number(res.data.subscriberCount || 0));
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update subscription.");
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Please sign in to download videos");
      return;
    }
    try {
      setDownloadStatus("Preparing download...");
      await axiosInstance.post('/download/request', { videoId: video._id });

      const videoUrl = typeof video.filepath === 'string' && video.filepath.startsWith('http') 
         ? video.filepath 
         : `http://localhost:5000/${video.filepath}`;

      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = video.filename || `${video.videotitle}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadStatus(user.plan === "Free" ? "Free plan: 1 download used for today" : "Premium plan: unlimited downloads active");
      alert("Video downloaded! It's also accessible in your Downloads section.");
    } catch (error: any) {
      if (error.response && error.response.status === 403 && error.response.data && error.response.data.message === "DOWNLOAD_LIMIT_REACHED") {
        setDownloadStatus("Free plan limit reached. Upgrade for unlimited downloads.");
        setIsPremiumModalOpen(true);
      } else if (error.response?.status === 401) {
        setDownloadStatus("Please sign in to download videos.");
        alert("Please sign in to download videos");
      } else {
        setDownloadStatus(null);
        alert("Failed to download video. Please try again.");
      }
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{channelName}</h3>
            <p className="text-sm text-muted-foreground transition-colors duration-500">{subscriberCount.toLocaleString()} subscribers</p>
          </div>
          <Button className="ml-4" onClick={handleSubscribe} variant={isSubscribed ? "secondary" : "default"}>
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-full transition-colors duration-500">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full hover:bg-black/5 dark:hover:bg-white/5"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full hover:bg-black/5 dark:hover:bg-white/5"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-current" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-muted rounded-full transition-colors duration-500 ${
              isWatchLater ? "text-red-500" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-muted rounded-full transition-colors duration-500"
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-muted rounded-full transition-colors duration-500"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-muted rounded-full transition-colors duration-500"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {downloadStatus && (
        <p className="text-sm font-medium text-muted-foreground">{downloadStatus}</p>
      )}
      <div className="bg-muted rounded-xl p-4 transition-colors duration-500">
        <div className="flex gap-4 text-sm font-semibold mb-2">
          <span>{video.views.toLocaleString()} views</span>
          <span className="text-muted-foreground">{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm leading-relaxed ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
      />
    </div>
  );
};

export default VideoInfo;
