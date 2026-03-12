import { component$, Slot, useSignal, useVisibleTask$, $, useOnDocument } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

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
  const showMobileMenu = useSignal(false);

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
      if (!target.closest(".mobile-menu")) {
        showMobileMenu.value = false;
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

  const toggleMobileMenu = $(() => {
    showMobileMenu.value = !showMobileMenu.value;
  });

  const navItems = [
    { href: "/", label: "Browse" },
    { href: "/add-book/", label: "Add Book" },
    { href: "/my-listings/", label: "My Listings" },
    { href: "/transactions/", label: "Transactions" },
  ];

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <nav class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="flex items-center md:hidden">
                <button
                  onClick$={toggleMobileMenu}
                  class="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                  aria-label="Open menu"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showMobileMenu.value ? (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
              <Link href="/" class="text-xl sm:text-2xl font-bold text-indigo-600">
                WorldLibrary
              </Link>
            </div>
            
            <div class="hidden md:flex items-center space-x-2">
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
                      class="flex items-center gap-1 hover:bg-gray-100 rounded-full p-1 transition-colors cursor-pointer"
                    >
                      {user.value.profile_picture ? (
                        <img 
                          src={user.value.profile_picture?.replace('/upload/', '/upload/w_64,h_64,c_fill,q_auto,f_auto/')} 
                          alt={user.value.name}
                          class="w-8 h-8 rounded-full object-cover"
                          width="32"
                          height="32"
                          loading="lazy"
                        />
                      ) : (
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {user.value.name.charAt(0).toUpperCase()}
                        </div>
                      )}
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

            <div class="flex items-center md:hidden space-x-2">
              {!loading.value && !user.value && (
                <Link
                  href="/login/"
                  class="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {showMobileMenu.value && (
          <div class="md:hidden border-t border-gray-200 mobile-menu">
            <div class="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={`block px-3 py-2 rounded-md text-base font-medium ${
                    loc.url.pathname === item.href
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick$={() => showMobileMenu.value = false}
                >
                  {item.label}
                </Link>
              ))}
              {!loading.value && user.value && (
                <>
                  <div class="border-t border-gray-200 pt-2 mt-2">
                    <div class="flex items-center gap-3 px-3 py-2">
                      {user.value.profile_picture ? (
                        <img 
                          src={user.value.profile_picture?.replace('/upload/', '/upload/w_64,h_64,c_fill,q_auto,f_auto/')} 
                          alt={user.value.name}
                          class="w-10 h-10 rounded-full object-cover"
                          width="40"
                          height="40"
                          loading="lazy"
                        />
                      ) : (
                        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                          {user.value.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p class="font-medium text-gray-900">{user.value.name}</p>
                        <p class="text-sm text-gray-500">{user.value.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/my-listings/"
                      class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick$={() => showMobileMenu.value = false}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick$={handleLogout}
                      class="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
              {!loading.value && !user.value && (
                <Link
                  href="/login/"
                  class="block w-full text-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
                  onClick$={() => showMobileMenu.value = false}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
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
