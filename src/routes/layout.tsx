import { component$, Slot, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
}

export default component$(() => {
  const loc = useLocation();
  const user = useSignal<User | null>(null);
  const loading = useSignal(true);

  useVisibleTask$(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
    loading.value = false;
  });

  const handleLogout = $(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  });

  const navItems = [
    { href: "/", label: "Browse Books" },
    { href: "/add-book/", label: "Add Book" },
    { href: "/my-listings/", label: "My Listings" },
    { href: "/transactions/", label: "Transactions" },
  ];

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <nav class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <Link href="/" class="text-2xl font-bold text-indigo-600">
                WorldLibrary
              </Link>
            </div>
            <div class="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    loc.url.pathname === item.href
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {!loading.value && (
                user.value ? (
                  <div class="flex items-center gap-3 ml-4">
                    <span class="text-sm text-gray-600">
                      {user.value.name}
                    </span>
                    <button
                      onClick$={handleLogout}
                      class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login/"
                    class="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Login
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
      <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Slot />
      </main>
      <footer class="bg-white border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p class="text-center text-sm text-gray-500">
            WorldLibrary - Share books with the world
          </p>
        </div>
      </footer>
    </div>
  );
});
