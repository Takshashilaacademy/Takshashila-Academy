import CloudinaryLargeUploader, {
  MAX_VIDEO_BYTES,
} from "./CloudinaryLargeUploader.jsx";

export default function CloudinaryVideoUploader({
  onUploadComplete,
}) {
  return (
    <CloudinaryLargeUploader
      category="course-video"
      label="Course Video"
      description="Long course videos direct Cloudinary par secure chunked upload hongi. Render server par video file load nahi hogi."
      accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
      maxBytes={
        MAX_VIDEO_BYTES
      }
      maxLabel="5 GB"
      icon="video"
      onUploadComplete={
        onUploadComplete
      }
    />
  );
}