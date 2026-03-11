import { component$, useSignal, $, PropFunction } from "@builder.io/qwik";
import { API_URL } from "~/context/auth";

interface UploadProps {
  fileType?: "image" | "profile";
  value?: string;
  onChange$?: PropFunction<(url: string) => void>;
}

export const FileUpload = component$<UploadProps>(({ fileType = "image", value, onChange$ }) => {
  const preview = useSignal(value || "");
  const uploading = useSignal(false);
  const error = useSignal("");

  const handleFile = $(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error.value = "File too large. Max 5MB.";
      return;
    }

    if (!file.type.startsWith("image/")) {
      error.value = "Only image files allowed.";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      preview.value = reader.result as string;
    };
    reader.readAsDataURL(file);

    uploading.value = true;
    error.value = "";

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const base64Data = base64.split(",")[1];

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64Data,
          fileName: file.name,
          contentType: file.type,
          fileType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (onChange$) {
        onChange$(data.url);
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      uploading.value = false;
    }
  });

  return (
    <div class="space-y-2">
      <div class="flex items-center justify-center">
        <label class="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange$={handleFile}
            class="hidden"
          />
          <div class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-indigo-500 transition-colors overflow-hidden">
            {uploading.value ? (
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            ) : preview.value ? (
              <img src={preview.value} alt="Preview" class="w-full h-full object-cover" width="128" height="128" />
            ) : (
              <div class="text-center text-gray-400">
                <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs">Upload</span>
              </div>
            )}
          </div>
        </label>
      </div>
      
      {error.value && (
        <p class="text-red-500 text-sm text-center">{error.value}</p>
      )}
      
      {preview.value && (
        <button
          type="button"
          onClick$={() => {
            preview.value = "";
            if (onChange$) onChange$("");
          }}
          class="text-red-500 text-sm hover:underline"
        >
          Remove
        </button>
      )}
    </div>
  );
});

export default FileUpload;
