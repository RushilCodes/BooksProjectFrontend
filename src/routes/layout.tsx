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
    <div class="min-h-screen flex flex-col">
      <nav class="bg-library-50 border-b-2 border-library-300 shadow-sm paper-texture">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="flex items-center md:hidden">
                <button
                  onClick$={toggleMobileMenu}
                  class="p-2 rounded-md text-library-700 hover:bg-library-100"
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
              <Link href="/" class="flex items-center gap-2 text-xl sm:text-2xl font-serif font-bold text-library-800">
                <svg class="w-8 h-8 text-accent-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.55c0 4.35-3.07 8.45-7.5 9.57-.42-.11-.84-.24-1.25-.39C7.38 24.09 4 20.06 4 15.33V7.78l8-3.6zM9 9v2h6V9H9zm0 4v2h6v-2H9z"/>
                </svg>
                <span>WorldLibrary</span>
              </Link>
            </div>
            
            <div class="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    loc.url.pathname === item.href
                      ? "bg-accent-100 text-accent-800 shadow-sm"
                      : "text-library-800 hover:bg-library-100"
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
                      class="flex items-center gap-1 hover:bg-library-100 rounded-full p-1 transition-colors cursor-pointer"
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
                        <div class="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-semibold text-sm border-2 border-accent-200">
                          {user.value.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <svg class="w-4 h-4 text-library-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showMenu.value && (
                      <div class="absolute right-0 mt-2 w-64 bg-library-50 rounded-lg shadow-xl border-2 border-library-300 py-2 z-50 paper-texture">
                        <div class="px-4 py-3 border-b border-library-200">
                          <p class="font-semibold text-library-900">{user.value.name}</p>
                          <p class="text-sm text-library-600">{user.value.email}</p>
                        </div>
                        <Link
                          href="/my-listings/"
                          class="block px-4 py-2 text-sm text-library-800 hover:bg-library-100 transition-colors"
                          onClick$={() => showMenu.value = false}
                        >
                          My Profile
                        </Link>
                        <button
                          onClick$={handleLogout}
                          class="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login/"
                    class="ml-4 px-4 py-2 bg-accent-600 text-white text-sm font-semibold rounded-md hover:bg-accent-700 transition-colors shadow-md hover:shadow-lg"
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
                  class="px-3 py-1.5 bg-accent-600 text-white text-sm font-semibold rounded-md hover:bg-accent-700 shadow-md"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {showMobileMenu.value && (
          <div class="md:hidden border-t border-library-300 mobile-menu bg-library-50">
            <div class="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={`block px-3 py-2 rounded-md text-base font-medium ${
                    loc.url.pathname === item.href
                      ? "bg-accent-100 text-accent-800"
                      : "text-library-800 hover:bg-library-100"
                  }`}
                  onClick$={() => showMobileMenu.value = false}
                >
                  {item.label}
                </Link>
              ))}
              {!loading.value && user.value && (
                <>
                  <div class="border-t border-library-200 pt-2 mt-2">
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
                        <div class="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-semibold border-2 border-accent-200">
                          {user.value.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p class="font-semibold text-library-900">{user.value.name}</p>
                        <p class="text-sm text-library-600">{user.value.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/my-listings/"
                      class="block px-3 py-2 text-base font-medium text-library-800 hover:bg-library-100 rounded-md transition-colors"
                      onClick$={() => showMobileMenu.value = false}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick$={handleLogout}
                      class="w-full text-left px-3 py-2 text-base font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
              {!loading.value && !user.value && (
                <Link
                  href="/login/"
                  class="block w-full text-center px-4 py-2 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 shadow-md"
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
      <footer class="bg-library-50 border-t-2 border-library-300 paper-texture">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p class="text-center text-sm text-library-600 font-medium">
            📚 WorldLibrary - Share the joy of reading with the world
          </p>
        </div>
      </footer>
    </div>
  );
});
