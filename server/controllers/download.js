import Download from "../Modals/Download.js";
import User from "../Modals/Auth.js";

export const getDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({ viewer: req.userId });
    res.status(200).json(downloads);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch downloads", error });
  }
};

export const requestDownload = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.plan !== 'Gold') {
      // Check today's downloads
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayDownloads = await Download.countDocuments({
        viewer: userId,
        downloadedOn: { $gte: startOfDay }
      });

      if (todayDownloads >= 1) {
        return res.status(403).json({ message: "DOWNLOAD_LIMIT_REACHED" });
      }
    }

    // Record the download
    const newDownload = new Download({
      videoId,
      viewer: userId
    });
    await newDownload.save();

    res.status(200).json({ message: "Download authorized" });
  } catch (error) {
    res.status(500).json({ message: "Failed to process download", error });
  }
};
