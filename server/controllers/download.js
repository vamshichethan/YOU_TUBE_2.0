import Download from "../Modals/Download.js";
import User from "../Modals/Auth.js";

const PREMIUM_PLANS = new Set(["Bronze", "Silver", "Gold"]);
const getDayKey = () => new Date().toISOString().slice(0, 10);

export const getDownloads = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Please sign in to view downloads" });
    }

    const downloads = await Download.find({ viewer: req.userId }).sort({ downloadedOn: -1 });
    res.status(200).json(downloads);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch downloads", error });
  }
};

export const requestDownload = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Please sign in to download videos" });
    }

    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPremiumUser = PREMIUM_PLANS.has(user.plan || "Free");

    if (!isPremiumUser) {
      const dayKey = getDayKey();
      const quotaReservation = await Download.findOneAndUpdate(
        {
          viewer: userId,
          dayKey,
          isFreeQuota: true,
        },
        {
          $setOnInsert: {
            videoId,
            viewer: userId,
            downloadedOn: new Date(),
            dayKey,
            isFreeQuota: true,
            planAtDownload: user.plan || "Free",
          },
        },
        {
          upsert: true,
          new: false,
        }
      );

      if (quotaReservation) {
        return res.status(403).json({
          message: "DOWNLOAD_LIMIT_REACHED",
          plan: user.plan || "Free",
          remainingDownloadsToday: 0,
          upgradeRequired: true,
        });
      }

      const freeDownloadRecord = new Download({
        videoId,
        viewer: userId,
        downloadedOn: new Date(),
        dayKey,
        isFreeQuota: false,
        planAtDownload: user.plan || "Free",
      });
      await freeDownloadRecord.save();
    } else {
      const newDownload = new Download({
        videoId,
        viewer: userId,
        downloadedOn: new Date(),
        planAtDownload: user.plan || "Free",
      });
      await newDownload.save();
    }

    res.status(200).json({
      message: "Download authorized",
      plan: user.plan || "Free",
      unlimitedDownloads: isPremiumUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process download", error });
  }
};
