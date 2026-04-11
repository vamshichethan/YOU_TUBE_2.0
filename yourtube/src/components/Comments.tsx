import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Languages, MapPin } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city?: string;
  likes: string[];
  dislikes: string[];
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState("Unknown");
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadComments();
    fetchUserCity();
  }, [videoId]);

  const fetchUserCity = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      setUserCity(data.city || 'Bangalore');
    } catch (error) {
       setUserCity('Bangalore');
    }
  };

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    // Front-end Special Character Check
    const specialChars = /[@#$%^&*]/;
    if (specialChars.test(newComment)) {
      alert("Comments containing special characters (@#$%^&*) are not allowed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        city: userCity
      });
      if (res.data.comment) {
        await loadComments();
      }
      setNewComment("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error adding comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return alert("Please login to react");
    try {
      const res = await axiosInstance.post(`/comment/like/${id}`, { userId: user._id });
      setComments(prev => prev.map(c => c._id === id ? res.data : c));
    } catch (err) { console.log(err); }
  };

  const handleDislike = async (id: string) => {
    if (!user) return alert("Please login to react");
    try {
      const res = await axiosInstance.post(`/comment/dislike/${id}`, { userId: user._id });
      if (res.data.deleted) {
         setComments(prev => prev.filter(c => c._id !== id));
         alert("This comment has been automatically removed due to multiple dislikes.");
      } else {
         setComments(prev => prev.map(c => c._id === id ? res.data : c));
      }
    } catch (err) { console.log(err); }
  };

  const handleTranslate = async (comment: Comment) => {
    if (translatedComments[comment._id]) {
      // Toggle back if already translated
      const newTranslations = { ...translatedComments };
      delete newTranslations[comment._id];
      setTranslatedComments(newTranslations);
      return;
    }

    // Mock Translation Logic
    const translated = `[Translated to English]: ${comment.commentbody}`;
    setTranslatedComments(prev => ({ ...prev, [comment._id]: translated }));
  };

  if (loading) {
    return <div className="text-muted-foreground animate-pulse py-10 text-center">Loading comments...</div>;
  }

  return (
    <div className="space-y-6 mt-8 p-6 bg-muted/20 rounded-[2rem] border border-border/50 transition-colors duration-500">
      <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
        {comments.length} Comments
      </h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 border border-border/50">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-muted text-foreground">{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Add a friendly comment... (No @#$%^&*)"
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none border-0 border-b-2 border-border/50 bg-transparent rounded-none focus-visible:ring-0 focus:border-red-500 transition-all font-sans text-lg placeholder:opacity-50"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                className="hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 font-bold shadow-lg shadow-red-500/20"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 mt-10">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-4 group">
            <Avatar className="w-10 h-10 ring-2 ring-background shadow-md">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.usercommented}`} />
              <AvatarFallback className="bg-muted">{comment.usercommented[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-sm text-foreground">{comment.usercommented}</span>
                <span className="text-[10px] font-bold py-0.5 px-2 bg-muted rounded-full text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-red-500" />
                  {comment.city || 'Bangalore'}
                </span>
                <span className="text-[10px] text-muted-foreground/40">•</span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {formatDistanceToNow(new Date(comment.commentedon))} ago
                </span>
              </div>

              <div className="mt-1">
                <p className="text-sm text-foreground/90 leading-relaxed font-sans font-medium">
                  {translatedComments[comment._id] || comment.commentbody}
                </p>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleLike(comment._id)}
                    className={`p-2 rounded-full hover:bg-muted transition-all duration-200 ${comment.likes?.includes(user?._id) ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-muted-foreground">{comment.likes?.length || 0}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleDislike(comment._id)}
                    className={`p-2 rounded-full hover:bg-muted transition-all duration-200 ${comment.dislikes?.includes(user?._id) ? 'text-foreground bg-foreground/10' : 'text-muted-foreground'}`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-muted-foreground">{comment.dislikes?.length || 0}</span>
                </div>

                <button 
                  onClick={() => handleTranslate(comment)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-2 py-1.5 px-3 hover:bg-red-500/5 rounded-full"
                >
                  <Languages className="w-3.5 h-3.5" />
                  {translatedComments[comment._id] ? "Show Original" : "Translate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
