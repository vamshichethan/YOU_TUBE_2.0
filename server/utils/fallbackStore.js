export const FALLBACK_VIDEO_IDS = [
  "680000000000000000000001",
  "680000000000000000000002",
];

export const fallbackVideos = [
  {
    _id: FALLBACK_VIDEO_IDS[0],
    videotitle: "Amazing Nature Explorers",
    filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
    filepath: "uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
    filetype: "video/mp4",
    filesize: "1024",
    videochanel: "Nature Central",
    uploader: "nature_user",
    views: 1250,
    Like: 24,
    Dislike: 2,
    createdAt: new Date().toISOString(),
  },
  {
    _id: FALLBACK_VIDEO_IDS[1],
    videotitle: "Chef Master: Healthy Pasta",
    filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
    filepath: "uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
    filetype: "video/mp4",
    filesize: "1024",
    videochanel: "Foodies TV",
    uploader: "chef_user",
    views: 2400,
    Like: 31,
    Dislike: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const fallbackUsers = new Map();
export const fallbackComments = new Map(
  fallbackVideos.map((video) => [
    video._id,
    [
      {
        _id: `${video._id}_comment_1`,
        videoid: video._id,
        userid: "demo-user-1",
        commentbody: `Loving this ${video.videotitle.toLowerCase()} upload.`,
        usercommented: "YourTube Fan",
        city: "Bengaluru",
        likes: ["user1", "user2"],
        dislikes: [],
        commentedon: new Date().toISOString(),
      },
    ],
  ])
);
export const fallbackVideoReactions = new Map();
export const fallbackWatchLater = new Map();

const ensureVideoReactionState = (videoId) => {
  if (!fallbackVideoReactions.has(videoId)) {
    const matchingVideo = fallbackVideos.find((video) => video._id === videoId);
    fallbackVideoReactions.set(videoId, {
      likes: matchingVideo?.Like || 0,
      dislikes: matchingVideo?.Dislike || 0,
      reactions: new Map(),
    });
  }

  return fallbackVideoReactions.get(videoId);
};

export const getFallbackVideoById = (videoId) =>
  fallbackVideos.find((video) => video._id === videoId) || null;

export const getFallbackVideoReactionState = (videoId) =>
  ensureVideoReactionState(videoId);

export const getFallbackComments = (videoId) =>
  [...(fallbackComments.get(videoId) || [])].sort(
    (a, b) => new Date(b.commentedon).getTime() - new Date(a.commentedon).getTime()
  );

export const saveFallbackComment = (commentRecord) => {
  const existingComments = fallbackComments.get(commentRecord.videoid) || [];
  fallbackComments.set(commentRecord.videoid, [commentRecord, ...existingComments]);
  return commentRecord;
};

export const updateFallbackComment = (commentId, updater) => {
  for (const [videoId, comments] of fallbackComments.entries()) {
    const commentIndex = comments.findIndex((entry) => entry._id === commentId);
    if (commentIndex === -1) continue;
    const updatedComment = updater(comments[commentIndex]);
    if (updatedComment) {
      comments[commentIndex] = updatedComment;
      fallbackComments.set(videoId, comments);
      return updatedComment;
    }
    comments.splice(commentIndex, 1);
    fallbackComments.set(videoId, comments);
    return null;
  }

  return undefined;
};

export const getFallbackWatchLaterIds = (userId) =>
  [...(fallbackWatchLater.get(userId) || new Set())];

export const toggleFallbackWatchLater = (userId, videoId) => {
  const existing = fallbackWatchLater.get(userId) || new Set();
  if (existing.has(videoId)) {
    existing.delete(videoId);
    fallbackWatchLater.set(userId, existing);
    return false;
  }

  existing.add(videoId);
  fallbackWatchLater.set(userId, existing);
  return true;
};
