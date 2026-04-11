import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const DownloadsPage = () => {
  const { user } = useUser();
  const [downloadedVideos, setDownloadedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!user) return;
      try {
        const [downloadsRes, videosRes] = await Promise.all([
          axiosInstance.get("/download/getall"),
          axiosInstance.get("/video/getall")
        ]);

        const downloadRecords = downloadsRes.data;
        const allVideos = videosRes.data;

        // Map records to full video objects
        const mappedVideos = downloadRecords
          .map((record: any) => allVideos.find((v: any) => v._id === record.videoId))
          .filter((v: any) => v !== undefined);

        // Deduplicate array based on video _id incase of multiple downloads
        const uniqueVideos = Array.from(new Set(mappedVideos.map((v: any) => v._id)))
          .map(id => mappedVideos.find((v: any) => v._id === id));

        setDownloadedVideos(uniqueVideos);
      } catch (error) {
        console.error("Failed to fetch downloads", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md space-y-4">
           <h2 className="text-2xl font-bold text-foreground">Sign in to see your downloads</h2>
           <p className="opacity-70">Downloaded videos are saved to your account for offline viewing anytime.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 font-sans bg-transparent min-h-screen transition-colors duration-500">
      <h1 className="text-4xl font-black mb-10 tracking-tighter">Your Library</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
           {[...Array(4)].map((_, i) => (
             <div key={i} className="space-y-4">
                <div className="aspect-video bg-muted rounded-2xl" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
             </div>
           ))}
        </div>
      ) : downloadedVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {downloadedVideos.map((video) => (
             <a href={`/watch/${video._id}`} key={video._id} className="block group">
               <div className="w-full aspect-video bg-muted rounded-2xl overflow-hidden shadow-xl relative transition-all duration-500 group-hover:shadow-red-500/10 group-hover:-translate-y-1">
                 <video src={typeof video.filepath === 'string' && video.filepath.startsWith('http') ? video.filepath : `http://localhost:5000/${video.filepath}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-all duration-300"></div>
               </div>
               <div className="mt-5 flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex-shrink-0 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-white/10">
                   {video.videochanel?.[0] || 'C'}
                 </div>
                 <div className="space-y-1">
                   <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-red-500 transition-colors duration-200">{video.videotitle}</h3>
                   <p className="text-sm text-muted-foreground font-semibold opacity-70 hover:opacity-100 transition-opacity">{video.videochanel}</p>
                 </div>
               </div>
             </a>
           ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/40 backdrop-blur-sm transition-all duration-500 hover:bg-muted/30">
          <div className="max-w-sm mx-auto space-y-4">
            <h2 className="text-2xl font-black tracking-tight">Your library is empty</h2>
            <p className="text-sm text-muted-foreground opacity-70 leading-relaxed font-medium">Looking for something to watch later? Download your favorite videos to see them here.</p>
            <div className="pt-4">
               <a href="/" className="inline-flex items-center justify-center px-6 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 active:scale-95">Browse Videos</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
