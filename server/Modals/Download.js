import mongoose from "mongoose";

const downloadSchema = mongoose.Schema({
  videoId: { type: String, required: true },
  viewer: { type: String, required: true },
  downloadedOn: { type: Date, default: Date.now }
});

export default mongoose.model("Download", downloadSchema);
