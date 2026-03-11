import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { API_URL, OAUTH_CONFIG } from "~/context/auth";

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
  const otpError = useSignal("");

  const handleEmailAuth = $(async () => {
    if (!email.value || !password.value) {
      error.value = "Please fill in all fields";
      return;
    }
    if (!isLogin.value && !name.value) {
      error.value = "Please enter your name";
      return;
    }

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
      
      if (!res.ok) {
        if (data.error?.includes("already exists")) {
          error.value = "Account exists. Click 'Already have an account? Sign in' below.";
        } else {
          error.value = data.error || "Auth failed";
        }
        return;
      }
      
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
    const config = OAUTH_CONFIG.google;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', crypto.randomUUID());
    
    // Use popup for OAuth
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      authUrl.toString(),
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Listen for message from popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'google_auth') {
        const { code } = event.data;
        try {
          authState.value.loading = true;
          const res = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
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
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup after popup closes
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  });

  const handleMicrosoftAuth = $(async () => {
    const config = OAUTH_CONFIG.microsoft;
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', crypto.randomUUID());
    
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      authUrl.toString(),
      'Microsoft Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'microsoft_auth') {
        const { code } = event.data;
        try {
          authState.value.loading = true;
          const res = await fetch(`${API_URL}/auth/microsoft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
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
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  });

  const handleSendOTP = $(async () => {
    if (!phone.value || phone.value.length < 10) {
      otpError.value = "Please enter a valid phone number";
      return;
    }
    
    try {
      authState.value.loading = true;
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.value }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        otpError.value = data.error || "Failed to send OTP";
        return;
      }
      
      otpSent.value = true;
      otpError.value = "";
    } catch (e: any) {
      otpError.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  const handlePhoneAuth = $(async () => {
    if (!otp.value || otp.value.length !== 6) {
      otpError.value = "Please enter the 6-digit OTP";
      return;
    }
    
    try {
      authState.value.loading = true;
      otpError.value = "";
      
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
      otpError.value = e.message;
    } finally {
      authState.value.loading = false;
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">
            {isLogin.value ? "Welcome Back" : "Create Account"}
          </h1>
          <p class="text-center text-gray-500 text-sm mb-6">
            {isLogin.value 
              ? "Sign in to your account to borrow books" 
              : "Sign up to start borrowing and lending books"}
          </p>

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
              {otpError.value && (
                <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {otpError.value}
                </div>
              )}
              
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
                    disabled={authState.value.loading}
                    class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    {authState.value.loading ? "Sending..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    OTP sent! Enter the 6-digit code (Demo: 123456)
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      value={otp.value}
                      onInput$={(e) => otp.value = (e.target as HTMLInputElement).value}
                      maxLength={6}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="123456"
                    />
                  </div>
                  {!isLogin.value && (
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={name.value}
                        onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your name"
                      />
                    </div>
                  )}
                  <button
                    onClick$={handlePhoneAuth}
                    disabled={authState.value.loading}
                    class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    {authState.value.loading ? "Verifying..." : "Verify & Login"}
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
