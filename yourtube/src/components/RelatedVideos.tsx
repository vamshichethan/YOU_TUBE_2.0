import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    views: number;
    createdAt: string;
    filepath: string;
  }>;
}

const RelatedVideos = ({ videos }: RelatedVideosProps) => {
  const vid = "/video/vdo.mp4"; // Default placeholder if needed

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <Link
          key={video._id}
          href={`/watch/${video._id}`}
          className="flex gap-3 group"
        >
          <div className="relative w-40 aspect-video bg-muted rounded-xl overflow-hidden flex-shrink-0 transition-colors duration-500 shadow-sm">
            <video
              src={typeof video.filepath === 'string' && video.filepath.startsWith('http') ? video.filepath : `http://localhost:5000/${video.filepath}`}
              className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-500 transition-colors duration-200 leading-snug">
              {video.videotitle}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium hover:text-foreground transition-colors">{video.videochanel}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 opacity-60">
              {video.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video.createdAt))} ago
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default RelatedVideos;
