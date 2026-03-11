import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";

export default component$(() => {
  const loc = useLocation();
  const loading = useSignal(true);
  const error = useSignal("");
  const success = useSignal(false);

  useVisibleTask$(() => {
    const code = loc.url.searchParams.get("code");
    const email = loc.url.searchParams.get("email");

    if (!code || !email) {
      error.value = "Missing verification code or email";
      loading.value = false;
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, email }),
        });

        const data = await res.json();

        if (!res.ok) {
          error.value = data.error || "Verification failed";
        } else {
          success.value = true;
        }
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    verify();
  });

  const handleResend = $(async () => {
    const email = loc.url.searchParams.get("email");
    if (!email) {
      error.value = "Email not found in URL";
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        error.value = data.error || "Failed to resend";
      } else {
        alert("Verification email resent!");
      }
    } catch (e: any) {
      error.value = e.message;
    }
  });

  if (loading.value) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success.value) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p class="text-gray-600 mb-6">Your email has been successfully verified.</p>
          <a
            href="/"
            class="inline-block w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="mb-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
        <p class="text-gray-600 mb-6">{error.value}</p>
        <button
          onClick$={handleResend}
          class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Verify Email - WorldLibrary",
  meta: [
    { name: "description", content: "Verify your email address" },
  ],
};
