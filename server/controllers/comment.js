import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, city } = req.body;
  
  // 1. Block Special Characters
  const specialChars = /[@#$%^&*]/;
  if (specialChars.test(commentbody)) {
    return res.status(400).json({ message: "Comments containing special characters (@#$%^&*) are not allowed." });
  }

  const postcomment = new comment({
    videoid,
    userid,
    commentbody,
    usercommented,
    city
  });

  try {
    await postcomment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const commentRecord = await comment.findById(id);
    if (!commentRecord) return res.status(404).json({ message: "Comment not found" });

    if (commentRecord.likes.includes(userId)) {
      commentRecord.likes = commentRecord.likes.filter(id => id !== userId);
    } else {
      commentRecord.likes.push(userId);
      commentRecord.dislikes = commentRecord.dislikes.filter(id => id !== userId);
    }
    await commentRecord.save();
    res.status(200).json(commentRecord);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const commentRecord = await comment.findById(id);
    if (!commentRecord) return res.status(404).json({ message: "Comment not found" });

    if (commentRecord.dislikes.includes(userId)) {
      commentRecord.dislikes = commentRecord.dislikes.filter(id => id !== userId);
    } else {
      commentRecord.dislikes.push(userId);
      commentRecord.likes = commentRecord.likes.filter(id => id !== userId);
    }

    // 2. Auto Deletion System (dislikes >= 2)
    if (commentRecord.dislikes.length >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ message: "Comment auto-deleted due to dislikes", deleted: true });
    }

    await commentRecord.save();
    res.status(200).json(commentRecord);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    if (commentvideo.length === 0 && videoid.startsWith('mock_')) throw new Error("Mock video fallback");
    return res.status(200).json(commentvideo);
  } catch (error) {
    // Return mock comments for demonstration
    const mockComments = [
      {
        _id: "comment_mock_1",
        commentbody: "This ప్రకృతి video is absolutely amazing! 🌿",
        usercommented: "NatureLover",
        city: "Bangalore",
        likes: ["user1", "user2"],
        dislikes: [],
        commentedon: new Date().toISOString()
      }
    ];
    return res.status(200).json(mockComments);
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
