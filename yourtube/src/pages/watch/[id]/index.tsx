import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [videoDetail, setVideoDetail] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/video/getall");
        const found = res.data?.find((vid: any) => vid._id === id);
        setVideoDetail(found);
        setAllVideos(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchvideo();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse text-muted-foreground min-h-screen">
        <div className="w-full max-w-4xl aspect-video bg-muted rounded-2xl mb-8" />
        <p className="text-xl font-medium">Loading premium player...</p>
      </div>
    );
  }
  
  if (!videoDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-sans">
        Video not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Videopplayer video={videoDetail} allVideos={allVideos} />
            <VideoInfo video={videoDetail} />
            <div id="comments-section" className="pt-4">
               <Comments videoId={id} />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Up Next</h2>
            <RelatedVideos videos={allVideos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
