import comment from "../Modals/comment.js";
import mongoose from "mongoose";
import { resolveRequestGeo } from "../lib/geo.js";

const allowedCommentPattern = /^[\p{L}\p{M}\p{N}\p{Zs}]+$/u;

const isValidCommentBody = (value = "") => {
  const trimmedValue = value.trim();
  return Boolean(trimmedValue) && allowedCommentPattern.test(trimmedValue);
};

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented } = req.body;

  if (!isValidCommentBody(commentbody)) {
    return res.status(400).json({
      message:
        "Comments may include letters from any language, numbers, and spaces only. Special characters are blocked.",
    });
  }

  const geo = await resolveRequestGeo(req);
  const postcomment = new comment({
    videoid,
    userid,
    commentbody: commentbody.trim(),
    usercommented,
    city: geo.city || "Unknown city",
  });

  try {
    await postcomment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Comment text is required for translation." });
  }

  if (!targetLanguage?.trim()) {
    return res.status(400).json({ message: "Target language is required." });
  }

  try {
    const translationResponse = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLanguage
      )}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (!translationResponse.ok) {
      throw new Error(`Translation request failed with status ${translationResponse.status}`);
    }

    const translationData = await translationResponse.json();
    const translatedText = Array.isArray(translationData?.[0])
      ? translationData[0].map((segment) => segment?.[0] || "").join("")
      : "";

    if (!translatedText) {
      throw new Error("Empty translation response");
    }

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("translation error:", error);
    return res.status(500).json({ message: "Unable to translate this comment right now." });
  }
};

export const likeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    let commentRecord = await comment.findById(id);
    if (!commentRecord) return res.status(404).json({ message: "Comment not found" });

    if (commentRecord.likes.includes(userId)) {
      commentRecord = await comment.findByIdAndUpdate(
        id,
        {
          $pull: {
            likes: userId,
          },
        },
        { new: true }
      );
    } else {
      commentRecord = await comment.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            likes: userId,
          },
          $pull: {
            dislikes: userId,
          },
        },
        { new: true }
      );
    }

    res.status(200).json(commentRecord);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    let commentRecord = await comment.findById(id);
    if (!commentRecord) return res.status(404).json({ message: "Comment not found" });
    if (commentRecord.userid?.toString() === userId) {
      return res.status(400).json({ message: "You cannot dislike your own comment." });
    }

    if (commentRecord.dislikes.includes(userId)) {
      commentRecord = await comment.findByIdAndUpdate(
        id,
        {
          $pull: {
            dislikes: userId,
          },
        },
        { new: true }
      );
    } else {
      commentRecord = await comment.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            dislikes: userId,
          },
          $pull: {
            likes: userId,
          },
        },
        { new: true }
      );
    }

    if (commentRecord && commentRecord.dislikes.length >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ message: "Comment auto-deleted due to dislikes", deleted: true });
    }

    res.status(200).json(commentRecord);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid }).sort({ commentedon: -1 });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ message: "Failed to fetch comments" });
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

  if (!isValidCommentBody(commentbody)) {
    return res.status(400).json({
      message:
        "Comments may include letters from any language, numbers, and spaces only. Special characters are blocked.",
    });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody.trim() },
    }, { new: true });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
