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
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
      <p class="text-gray-600 mb-8">Manage your books available for lending</p>

      {currentUser.value && selectedUserId.value === currentUser.value.id && (
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-lg font-semibold mb-4">Profile</h2>
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
              <p class="font-medium text-lg">{currentUser.value.name}</p>
              <p class="text-gray-600">{currentUser.value.email}</p>
              <p class="text-sm text-gray-500 capitalize">Signed in with {currentUser.value.provider}</p>
            </div>
          </div>
        </div>
      )}

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          View as User
        </label>
        <select
          value={selectedUserId.value}
          onChange$={(e) =>
            (selectedUserId.value = (e.target as HTMLSelectElement).value)
          }
          class="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : listings.value.length === 0 ? (
        <div class="text-center py-12 bg-white rounded-lg shadow">
          <p class="text-gray-500 text-lg">You haven't listed any books yet.</p>
          <a
            href="/add-book/"
            class="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Add your first book →
          </a>
        </div>
      ) : (
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Day
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {listings.value.map((listing) => (
                <tr key={listing.id}>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        {listing.book?.cover_image ? (
                          <img
                            src={listing.book.cover_image}
                            alt={listing.book.title}
                            class="h-12 w-12 object-cover rounded"
                            width="48"
                            height="48"
                          />
                        ) : (
                          <span class="text-xl">📚</span>
                        )}
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {listing.book?.title}
                        </div>
                        <div class="text-sm text-gray-500">
                          {listing.book?.author}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-indigo-600 font-medium">
                      ${(listing.price_per_day / 100).toFixed(2)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`px-2 py-1 text-xs font-medium rounded-full ${
                        listing.available
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.available ? "Available" : "Borrowed"}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      Edit
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
