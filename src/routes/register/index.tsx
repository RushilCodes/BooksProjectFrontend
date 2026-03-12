import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";
import { FileUpload } from "~/components/upload/file-upload";

export default component$(() => {
  const step = useSignal<"details" | "phone" | "verify">("details");
  const name = useSignal("");
  const email = useSignal("");
  const phone = useSignal("");
  const profilePicture = useSignal("");
  const otp = useSignal("");
  const loading = useSignal(false);
  const error = useSignal("");
  const otpSid = useSignal("");

  const handleSubmitDetails = $(() => {
    if (!name.value.trim()) {
      error.value = "Name is required";
      return;
    }
    step.value = "phone";
  });

  const handleSendOTP = $(async () => {
    if (!phone.value || phone.value.length < 10) {
      error.value = "Please enter a valid phone number";
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.value }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        error.value = data.error || "Failed to send OTP";
        return;
      }

      otpSid.value = data.sid;
      step.value = "verify";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleVerify = $(async () => {
    if (!otp.value || otp.value.length !== 6) {
      error.value = "Please enter the 6-digit OTP";
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      const res = await fetch(`${API_URL}/auth/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.value,
          otp: otp.value,
          name: name.value,
          profilePicture: profilePicture.value || null,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        error.value = data.error || "Verification failed";
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="bg-library-50 rounded-lg shadow-xl p-8 border-2 border-library-300 paper-texture">
          <div class="flex justify-center mb-4">
            <svg class="w-16 h-16 text-accent-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.55c0 4.35-3.07 8.45-7.5 9.57-.42-.11-.84-.24-1.25-.39C7.38 24.09 4 20.06 4 15.33V7.78l8-3.6zM9 9v2h6V9H9zm0 4v2h6v-2H9z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-serif font-bold text-center text-library-900 mb-2">
            📖 Create Account
          </h1>
          <p class="text-center text-library-600 text-sm mb-6">
            <span class="font-semibold">Step {step.value === "details" ? "1" : step.value === "phone" ? "2" : "3"} of 3</span>
          </p>

          {error.value && (
            <div class="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm shadow-sm">
              <strong>⚠️ Error:</strong> {error.value}
            </div>
          )}

          {step.value === "details" && (
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-library-800 mb-1">
                  👤 Name *
                </label>
                <input
                  type="text"
                  value={name.value}
                  onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                  class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-library-800 mb-1">
                  ✉️ Email (optional)
                </label>
                <input
                  type="email"
                  value={email.value}
                  onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                  class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-library-800 mb-1">
                  🖼️ Profile Picture (optional)
                </label>
                <FileUpload
                  fileType="profile"
                  value={profilePicture.value}
                  onChange$={(url) => profilePicture.value = url}
                />
              </div>

              <button
                onClick$={handleSubmitDetails}
                class="w-full py-3 bg-accent-600 text-white font-bold rounded-md hover:bg-accent-700 transition-all shadow-md hover:shadow-lg"
              >
                Continue →
              </button>
            </div>
          )}

          {step.value === "phone" && (
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-library-800 mb-1">
                  📱 Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone.value}
                  onInput$={(e) => phone.value = (e.target as HTMLInputElement).value}
                  class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
                  placeholder="9351334451"
                />
              </div>

              <button
                onClick$={handleSendOTP}
                disabled={loading.value}
                class="w-full py-3 bg-accent-600 text-white font-bold rounded-md hover:bg-accent-700 transition-all shadow-md hover:shadow-lg disabled:bg-library-400 disabled:shadow-none"
              >
                {loading.value ? "📤 Sending..." : "📤 Send OTP"}
              </button>

              <button
                onClick$={() => step.value = "details"}
                class="w-full py-2 text-library-700 text-sm hover:text-library-900 font-medium"
              >
                ← Back
              </button>
            </div>
          )}

          {step.value === "verify" && (
            <div class="space-y-4">
              <div class="p-3 bg-green-50 border-2 border-green-300 rounded-lg text-green-800 text-sm shadow-sm font-medium">
                ✓ OTP sent to +91 {phone.value}
              </div>

              <div>
                <label class="block text-sm font-semibold text-library-800 mb-1">
                  🔢 Enter OTP *
                </label>
                <input
                  type="text"
                  value={otp.value}
                  onInput$={(e) => otp.value = (e.target as HTMLInputElement).value}
                  maxLength={6}
                  class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                onClick$={handleVerify}
                disabled={loading.value}
                class="w-full py-3 bg-accent-600 text-white font-bold rounded-md hover:bg-accent-700 transition-all shadow-md hover:shadow-lg disabled:bg-library-400 disabled:shadow-none"
              >
                {loading.value ? "⏳ Verifying..." : "✓ Create Account"}
              </button>

              <button
                onClick$={() => step.value = "phone"}
                class="w-full py-2 text-library-700 text-sm hover:text-library-900 font-medium"
              >
                ← Back
              </button>
            </div>
          )}

          <p class="text-center text-sm text-library-600 mt-6">
            Already have an account?{" "}
            <Link href="/login/" class="text-accent-700 hover:text-accent-800 font-semibold hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Register - WorldLibrary",
  meta: [
    {
      name: "description",
      content: "Create a new account on WorldLibrary",
    },
  ],
};
