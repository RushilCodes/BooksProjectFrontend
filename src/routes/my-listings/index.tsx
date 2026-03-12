import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";
import { FileUpload } from "~/components/upload/file-upload";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
  owner_id: string;
}

interface Listing {
  id: string;
  book_id: string;
  price_per_day: number;
  available: number;
  book?: Book;
}

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
  profile_picture?: string;
}

export default component$(() => {
  const listings = useSignal<Listing[]>([]);
  const loading = useSignal(true);
  const currentUser = useSignal<User | null>(null);
  const allUsers = useSignal<User[]>([]);
  const selectedUserId = useSignal("");

  useVisibleTask$(async () => {
    try {
      const usersRes = await fetch(`${API_URL}/users`);
      allUsers.value = await usersRes.json();
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        currentUser.value = JSON.parse(storedUser);
        selectedUserId.value = currentUser.value?.id || "";
      } else if (allUsers.value.length > 0) {
        selectedUserId.value = allUsers.value[0].id;
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  });

  useVisibleTask$(
    async ({ track }) => {
      track(() => selectedUserId.value);
      if (!selectedUserId.value) return;

      loading.value = true;
      try {
        const booksRes = await fetch(`${API_URL}/books`);
        const allBooks: Book[] = await booksRes.json();
        const userBooks = allBooks.filter(
          (b) => b.owner_id === selectedUserId.value
        );
        const bookIds = userBooks.map((b) => b.id);

        const listingsRes = await fetch(`${API_URL}/listings`);
        const allListings: Listing[] = await listingsRes.json();

        listings.value = allListings
          .filter((l) => bookIds.includes(l.book_id))
          .map((l) => ({
            ...l,
            book: userBooks.find((b) => b.id === l.book_id),
          }));
      } catch (e) {
        console.error("Failed to fetch listings:", e);
      } finally {
        loading.value = false;
      }
    },
    { strategy: "document-ready" }
  );

  return (
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-serif font-bold text-library-900 mb-2">📚 My Listings</h1>
      <p class="text-lg text-library-700 mb-8">Manage your books available for lending</p>

      {currentUser.value && selectedUserId.value === currentUser.value.id && (
        <div class="bg-library-50 rounded-lg shadow-lg p-6 mb-8 border-2 border-library-200 paper-texture">
          <h2 class="text-xl font-serif font-bold text-library-900 mb-4">👤 Profile</h2>
          <div class="flex items-center gap-6">
            <div class="flex-shrink-0">
              <FileUpload
                fileType="profile"
                value={currentUser.value.profile_picture}
                onChange$={async (url) => {
                  try {
                    const res = await fetch(`${API_URL}/users/${currentUser.value!.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profilePicture: url }),
                    });
                    if (res.ok) {
                      currentUser.value = { ...currentUser.value!, profile_picture: url };
                      localStorage.setItem("user", JSON.stringify(currentUser.value));
                    }
                  } catch (e) {
                    console.error("Failed to update profile:", e);
                  }
                }}
              />
            </div>
            <div>
              <p class="font-serif font-bold text-xl text-library-900">{currentUser.value.name}</p>
              <p class="text-library-700">{currentUser.value.email}</p>
              <p class="text-sm text-library-600 capitalize mt-1">✓ Signed in with {currentUser.value.provider}</p>
            </div>
          </div>
        </div>
      )}

      <div class="mb-6">
        <label class="block text-sm font-semibold text-library-800 mb-2">
          👥 View as User
        </label>
        <select
          value={selectedUserId.value}
          onChange$={(e) =>
            (selectedUserId.value = (e.target as HTMLSelectElement).value)
          }
          class="w-full sm:w-64 px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white font-medium"
        >
          {allUsers.value.map((user) => (
            <option key={user.id} value={user.id}>
              {`${user.name}`}
            </option>
          ))}
        </select>
      </div>

      {loading.value ? (
        <div class="flex justify-center items-center min-h-[300px]">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : listings.value.length === 0 ? (
        <div class="text-center py-16 bg-library-50 rounded-lg shadow-md border-2 border-library-200 paper-texture">
          <div class="text-6xl mb-4">📕</div>
          <p class="text-library-700 text-lg font-medium mb-2">You haven't listed any books yet.</p>
          <p class="text-library-600 mb-4">Start sharing your collection today</p>
          <a
            href="/add-book/"
            class="inline-block px-6 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 shadow-md hover:shadow-lg transition-all"
          >
            Add Your First Book →
          </a>
        </div>
      ) : (
        <div class="bg-library-50 rounded-lg shadow-lg overflow-hidden border-2 border-library-200">
          <table class="min-w-full divide-y divide-library-300">
            <thead class="bg-library-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-library-800 uppercase tracking-wider">
                  📖 Book
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-library-800 uppercase tracking-wider">
                  💵 Price/Day
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-library-800 uppercase tracking-wider">
                  🟢 Status
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-library-800 uppercase tracking-wider">
                  ⚙️ Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-library-200">
              {listings.value.map((listing) => (
                <tr key={listing.id}>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-library-200 to-library-300 rounded-md flex items-center justify-center shadow-sm">
                        {listing.book?.cover_image ? (
                          <img
                            src={listing.book.cover_image}
                            alt={listing.book.title}
                            class="h-14 w-14 object-cover rounded-md"
                            width="56"
                            height="56"
                          />
                        ) : (
                          <span class="text-2xl">📖</span>
                        )}
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-serif font-bold text-library-900">
                          {listing.book?.title}
                        </div>
                        <div class="text-sm text-library-600 italic">
                          by {listing.book?.author}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-accent-700 font-bold text-lg">
                      ${(listing.price_per_day / 100).toFixed(2)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                        listing.available
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-library-200 text-library-800 border border-library-400"
                      }`}
                    >
                      {listing.available ? "Available" : "Borrowed"}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-accent-700 hover:text-accent-900 text-sm font-semibold hover:underline transition-colors">
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "My Listings - WorldLibrary",
  meta: [
    {
      name: "description",
      content: "Manage your book listings on WorldLibrary",
    },
  ],
};
