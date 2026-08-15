import CloudinaryLargeUploader, {
  MAX_DOCUMENT_BYTES,
} from "./CloudinaryLargeUploader.jsx";

export default function CloudinaryDocumentUploader({
  onUploadComplete,
}) {
  return (
    <CloudinaryLargeUploader
      category="course-material"
      label="Study Material"
      description="PDF, DOC, DOCX aur TXT files direct Cloudinary par secure chunked upload hongi."
      accept="application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.txt,.doc,.docx"
      maxBytes={
        MAX_DOCUMENT_BYTES
      }
      maxLabel="500 MB"
      icon="file"
      onUploadComplete={
        onUploadComplete
      }
    />
  );
}