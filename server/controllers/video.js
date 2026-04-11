import video from "../Modals/video.js";

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
    const files = await video.find();
    if (files.length === 0) throw new Error("No videos found in DB");
    return res.status(200).send(files);
  } catch (error) {
    console.warn("DB connection failed or empty, returning mock fallback data.");
    const mockVideos = [
      {
        _id: "mock_1",
        videotitle: "Amazing Nature Explorers",
        videochanel: "Nature Central",
        uploader: "nature_user",
        views: 1250,
        createdAt: new Date().toISOString(),
        filepath: "uploads/sample.mp4"
      },
      {
        _id: "mock_2",
        videotitle: "Chef Master: Healthy Pasta",
        videochanel: "Foodies TV",
        uploader: "chef_user",
        views: 2400,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        filepath: "uploads/sample.mp4"
      }
    ];
    return res.status(200).send(mockVideos);
  }
};
