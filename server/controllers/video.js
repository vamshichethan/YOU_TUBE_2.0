import video from "../Modals/video.js";

const DEMO_FILEPATH = "uploads/2025-06-25T06-09-29.296Z-vdo.mp4";

const ensureDemoVideos = async () => {
  const existingVideos = await video.find();
  if (existingVideos.length > 0) {
    return existingVideos;
  }

  await video.insertMany([
    {
      videotitle: "Amazing Nature Explorers",
      filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
      filepath: DEMO_FILEPATH,
      filetype: "video/mp4",
      filesize: "1024",
      videochanel: "Nature Central",
      uploader: "nature_user",
      views: 1250,
      Like: 24,
      Dislike: 2,
    },
    {
      videotitle: "Chef Master Healthy Pasta",
      filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
      filepath: DEMO_FILEPATH,
      filetype: "video/mp4",
      filesize: "1024",
      videochanel: "Foodies TV",
      uploader: "chef_user",
      views: 2400,
      Like: 31,
      Dislike: 1,
    }
  ]);

  return video.find();
};

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path,
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await ensureDemoVideos();
    return res.status(200).send(files);
  } catch (error) {
    console.warn("DB connection failed or empty, returning mock fallback data.");
    const mockVideos = [
      {
        _id: "680000000000000000000001",
        videotitle: "Amazing Nature Explorers",
        videochanel: "Nature Central",
        uploader: "nature_user",
        views: 1250,
        createdAt: new Date().toISOString(),
        filepath: DEMO_FILEPATH,
        Like: 24,
        Dislike: 2,
      },
      {
        _id: "680000000000000000000002",
        videotitle: "Chef Master: Healthy Pasta",
        videochanel: "Foodies TV",
        uploader: "chef_user",
        views: 2400,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        filepath: DEMO_FILEPATH,
        Like: 31,
        Dislike: 1,
      }
    ];
    return res.status(200).send(mockVideos);
  }
};
