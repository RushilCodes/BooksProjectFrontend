import { component$, useSignal, $, useContext } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AuthContext, API_URL } from "~/context/auth";

export default component$(() => {
  const authState = useSignal({
    user: null,
    token: null,
    loading: false
  });
  
  const email = useSignal("");
  const password = useSignal("");
  const name = useSignal("");
  const phone = useSignal("");
  const otp = useSignal("");
  const error = useSignal("");
  const isLogin = useSignal(true);
  const showPhoneAuth = useSignal(false);
  const showPasswordForm = useSignal(true);
  const otpSent = useSignal(false);

  const handleEmailAuth = $(async () => {
    authState.value.loading = true;
    error.value = "";
    
    try {
      const endpoint = isLogin.value ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const body = isLogin.value 
        ? { email: email.value, password: password.value }
        : { email: email.value, password: password.value, name: name.value, provider: 'email' };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Auth failed");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      window.location.href = "/";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  const handleGoogleAuth = $(async () => {
    // In production, use Google OAuth popup
    // For demo, we'll use token-based auth
    const clientId = "YOUR_GOOGLE_CLIENT_ID";
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    
    // Simulated Google auth - in production use proper OAuth flow
    const mockGoogleToken = "google_mock_token_" + Date.now();
    const mockEmail = "user@gmail.com";
    const mockName = "Google User";
    
    try {
      authState.value.loading = true;
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          googleToken: mockGoogleToken,
          email: mockEmail,
          name: mockName
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google auth failed");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  const handleMicrosoftAuth = $(async () => {
    const mockMicrosoftToken = "microsoft_mock_token_" + Date.now();
    const mockEmail = "user@outlook.com";
    const mockName = "Microsoft User";
    
    try {
      authState.value.loading = true;
      const res = await fetch(`${API_URL}/auth/microsoft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          microsoftToken: mockMicrosoftToken,
          email: mockEmail,
          name: mockName
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Microsoft auth failed");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  const handleSendOTP = $(async () => {
    if (!phone.value || phone.value.length < 10) {
      error.value = "Please enter a valid phone number";
      return;
    }
    
    // In production, send OTP via SMS service
    // For demo, we'll simulate OTP
    otpSent.value = true;
    error.value = "Demo OTP: 123456";
  });

  const handlePhoneAuth = $(async () => {
    try {
      authState.value.loading = true;
      const res = await fetch(`${API_URL}/auth/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: phone.value,
          otp: otp.value,
          name: name.value || `User-${phone.value.slice(-4)}`
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Phone auth failed");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-center text-gray-900 mb-8">
            {isLogin.value ? "Welcome Back" : "Create Account"}
          </h1>

          {error.value && (
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error.value}
            </div>
          )}

          {showPasswordForm.value && (
            <div class="space-y-4">
              {!isLogin.value && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name.value}
                    onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your name"
                  />
                </div>
              )}
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email.value}
                  onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password.value}
                  onInput$={(e) => password.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                onClick$={handleEmailAuth}
                disabled={authState.value.loading}
                class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
              >
                {authState.value.loading ? "Please wait..." : isLogin.value ? "Sign In" : "Create Account"}
              </button>
              
              <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>
          )}

          {showPhoneAuth.value ? (
            <div class="space-y-4">
              {!otpSent.value ? (
                <>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone.value}
                      onInput$={(e) => phone.value = (e.target as HTMLInputElement).value}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1234567890"
                    />
                  </div>
                  <button
                    onClick$={handleSendOTP}
                    class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
                  >
                    Send OTP
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      value={otp.value}
                      onInput$={(e) => otp.value = (e.target as HTMLInputElement).value}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="123456"
                    />
                  </div>
                  <button
                    onClick$={handlePhoneAuth}
                    disabled={authState.value.loading}
                    class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    Verify & Login
                  </button>
                </>
              )}
              
              <button
                onClick$={() => { showPhoneAuth.value = false; showPasswordForm.value = true; }}
                class="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to email login
              </button>
            </div>
          ) : (
            <div class="space-y-3">
              <button
                onClick$={handleGoogleAuth}
                disabled={authState.value.loading}
                class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                onClick$={handleMicrosoftAuth}
                disabled={authState.value.loading}
                class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                Continue with Microsoft
              </button>
              
              <button
                onClick$={() => { showPhoneAuth.value = true; showPasswordForm.value = false; }}
                class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 16c0-1.5-1.3-2.7-3-2.7s-3 1.2-3 2.7c0 1.5 1.3 2.7 3 2.7s3-1.2 3-2.7M16 6.5c0-2.5-2-4.5-4.5-4.5S7 4 7 6.5 9 11 11.5 11 16 9 16 6.5m-2.3 6.8c-1.1 0-2.1-.4-2.8-1.1-.7-.7-1.1-1.6-1.1-2.8 0-1 .4-2 1.1-2.7.7-.7 1.7-1.1 2.8-1.1 1.1 0 2.1.4 2.8 1.1.7.7 1.1 1.6 1.1 2.7 0 1.1-.4 2.1-1.1 2.8-.7.7-1.7 1.1-2.8 1.1"/>
                </svg>
                Continue with Phone
              </button>
            </div>
          )}

          <div class="mt-6 text-center">
            <button
              onClick$={() => isLogin.value = !isLogin.value}
              class="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              {isLogin.value 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Login - WorldLibrary",
  meta: [
    { name: "description", content: "Login to WorldLibrary" },
  ],
};
