import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

export default component$(() => {
  const message = useSignal('Finishing Microsoft sign-in...');

  useVisibleTask$(() => {
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const error = currentUrl.searchParams.get('error');

    if (error) {
      message.value = 'Microsoft sign-in was canceled or failed. You can close this window.';
      return;
    }

    if (!code) {
      message.value = 'No Microsoft authorization code was found. You can close this window.';
      return;
    }

    if (window.opener) {
      window.opener.postMessage({ type: 'microsoft_auth', code }, window.location.origin);
      message.value = 'Microsoft sign-in complete. Closing this window...';
      setTimeout(() => window.close(), 300);
      return;
    }

    message.value = 'Microsoft sign-in complete. You can return to the app.';
  });

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        <h1 class="text-xl font-semibold text-gray-900 mb-2">Microsoft Callback</h1>
        <p class="text-gray-600">{message.value}</p>
      </div>
    </div>
  );
});
