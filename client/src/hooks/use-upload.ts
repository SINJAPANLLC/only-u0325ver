import { useState, useCallback } from "react";

interface UploadResponse {
  url: string;
  objectPath: string;
  [key: string]: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    (file: File): Promise<UploadResponse | null> => {
      return new Promise((resolve) => {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95);
            setProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data: UploadResponse = JSON.parse(xhr.responseText);
              setProgress(100);
              options.onSuccess?.(data);
              resolve(data);
            } catch {
              const err = new Error("Invalid response");
              setError(err);
              options.onError?.(err);
              resolve(null);
            }
          } else {
            let message = "Upload failed";
            try {
              const errData = JSON.parse(xhr.responseText);
              message = errData.error || errData.message || message;
            } catch {}
            const err = new Error(message);
            setError(err);
            options.onError?.(err);
            resolve(null);
          }
          setIsUploading(false);
        });

        xhr.addEventListener("error", () => {
          const err = new Error("Network error during upload");
          setError(err);
          options.onError?.(err);
          setIsUploading(false);
          resolve(null);
        });

        xhr.addEventListener("abort", () => {
          const err = new Error("Upload aborted");
          setError(err);
          options.onError?.(err);
          setIsUploading(false);
          resolve(null);
        });

        xhr.open("POST", "/api/uploads/bunny");
        xhr.send(formData);
      });
    },
    [options]
  );

  return {
    uploadFile,
    isUploading,
    error,
    progress,
  };
}
