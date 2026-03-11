import { component$, Slot, useSignal, useVisibleTask$, $, useOnDocument } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
  profile_picture?: string;
}

export default component$(() => {
  const loc = useLocation();
  const user = useSignal<User | null>(null);
  const loading = useSignal(true);
  const showMenu = useSignal(false);

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

  useOnDocument(
    "click",
    $((e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-menu")) {
        showMenu.value = false;
      }
    })
  );

  const handleLogout = $(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  });

  const toggleMenu = $(() => {
    showMenu.value = !showMenu.value;
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
                  <div class="relative ml-4 profile-menu">
                    <button
                      onClick$={toggleMenu}
                      class="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3 transition-colors cursor-pointer"
                    >
                      {user.value.profile_picture ? (
                        <img 
                          src={user.value.profile_picture} 
                          alt={user.value.name}
                          class="w-8 h-8 rounded-full object-cover"
                          width="32"
                          height="32"
                        />
                      ) : (
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {user.value.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span class="text-sm font-medium text-gray-700 hidden sm:inline">
                        {user.value.name}
                      </span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showMenu.value && (
                      <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div class="px-4 py-3 border-b border-gray-100">
                          <p class="font-medium text-gray-900">{user.value.name}</p>
                          <p class="text-sm text-gray-500">{user.value.email}</p>
                        </div>
                        <Link
                          href="/my-listings/"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick$={() => showMenu.value = false}
                        >
                          My Profile
                        </Link>
                        <button
                          onClick$={handleLogout}
                          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    )}
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
