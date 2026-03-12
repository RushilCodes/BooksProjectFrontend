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
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">
            Create Account
          </h1>
          <p class="text-center text-gray-500 text-sm mb-6">
            Step {step.value === "details" ? "1" : step.value === "phone" ? "2" : "3"} of 3
          </p>

          {error.value && (
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error.value}
            </div>
          )}

          {step.value === "details" && (
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name.value}
                  onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email.value}
                  onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture (optional)
                </label>
                <FileUpload
                  fileType="profile"
                  value={profilePicture.value}
                  onChange$={(url) => profilePicture.value = url}
                />
              </div>

              <button
                onClick$={handleSubmitDetails}
                class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          )}

          {step.value === "phone" && (
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone.value}
                  onInput$={(e) => phone.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="9351334451"
                />
              </div>

              <button
                onClick$={handleSendOTP}
                disabled={loading.value}
                class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {loading.value ? "Sending..." : "Send OTP"}
              </button>

              <button
                onClick$={() => step.value = "details"}
                class="w-full py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                Back
              </button>
            </div>
          )}

          {step.value === "verify" && (
            <div class="space-y-4">
              <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                OTP sent to +91 {phone.value}
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP *
                </label>
                <input
                  type="text"
                  value={otp.value}
                  onInput$={(e) => otp.value = (e.target as HTMLInputElement).value}
                  maxLength={6}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl letter-spacing-4"
                  placeholder="000000"
                />
              </div>

              <button
                onClick$={handleVerify}
                disabled={loading.value}
                class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {loading.value ? "Verifying..." : "Create Account"}
              </button>

              <button
                onClick$={() => step.value = "phone"}
                class="w-full py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                Back
              </button>
            </div>
          )}

          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login/" class="text-indigo-600 hover:text-indigo-700">
              Sign in
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
