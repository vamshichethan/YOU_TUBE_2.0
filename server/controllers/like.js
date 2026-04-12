import video from "../Modals/video.js";
import like from "../Modals/like.js";

export const handlelike = async (req, res) => {
  const { userId, action = "like" } = req.body;
  const { videoId } = req.params;
  try {
    const existingReaction = await like.findOne({
      viewer: userId,
      videoid: videoId,
    });

    if (existingReaction?.reaction === action) {
      await like.findByIdAndDelete(existingReaction._id);
      await video.findByIdAndUpdate(videoId, {
        $inc: action === "like" ? { Like: -1 } : { Dislike: -1 },
      });
      return res.status(200).json({
        liked: false,
        disliked: false,
      });
    }

    if (existingReaction) {
      await video.findByIdAndUpdate(videoId, {
        $inc: existingReaction.reaction === "like"
          ? { Like: -1, Dislike: 1 }
          : { Like: 1, Dislike: -1 },
      });
      existingReaction.reaction = action;
      await existingReaction.save();
    } else {
      await like.create({ viewer: userId, videoid: videoId, reaction: action });
      await video.findByIdAndUpdate(videoId, {
        $inc: action === "like" ? { Like: 1 } : { Dislike: 1 },
      });
    }

    return res.status(200).json({
      liked: action === "like",
      disliked: action === "dislike",
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const likevideo = await like
      .find({ viewer: userId, reaction: "like" })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
