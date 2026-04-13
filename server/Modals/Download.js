import mongoose from "mongoose";

const downloadSchema = mongoose.Schema({
  videoId: { type: String, required: true },
  viewer: { type: String, required: true },
  downloadedOn: { type: Date, default: Date.now },
  dayKey: { type: String },
  isFreeQuota: { type: Boolean, default: false },
  planAtDownload: { type: String, default: "Free" },
});

downloadSchema.index(
  { viewer: 1, dayKey: 1, isFreeQuota: 1 },
  {
    unique: true,
    partialFilterExpression: { isFreeQuota: true },
  }
);

export default mongoose.model("Download", downloadSchema);
