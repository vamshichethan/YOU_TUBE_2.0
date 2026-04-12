"use clinet";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";

const videos = "/video/vdo.mp4";
export default function VideoCard({ video }: any) {
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted transition-colors duration-500">
          <video
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${video?.filepath}`}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded font-medium">
            10:24
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary">{video?.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-red-500 transition-colors duration-200">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 hover:text-foreground transition-colors cursor-pointer">{video?.videochanel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {video?.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
