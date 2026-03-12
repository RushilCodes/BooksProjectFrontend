import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";

interface Listing {
  id: string;
  book_id: string;
  price_per_day: number;
  available: number;
  title: string;
  author: string;
  cover_image: string | null;
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
  const error = useSignal("");
  const user = useSignal<User | null>(null);
  const borrowDate = useSignal("");
  const returnDate = useSignal("");
  const selectedListing = useSignal<string | null>(null);
  const token = useSignal("");

  useVisibleTask$(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      
      if (storedToken) {
        token.value = storedToken;
      }
      
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser);
        } catch (e) {
          console.error("Failed to parse user:", e);
        }
      } else {
        const usersRes = await fetch(`${API_URL}/users`);
        const users = await usersRes.json();
        if (users.length > 0) {
          user.value = users[0];
        }
      }

      const res = await fetch(`${API_URL}/listings`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      listings.value = await res.json();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleBorrow = $(async (listingId: string) => {
    if (!user.value) {
      window.location.href = "/login";
      return;
    }
    
    if (!borrowDate.value || !returnDate.value) {
      alert("Please fill in all fields");
      return;
    }

    const startDate = new Date(borrowDate.value);
    const endDate = new Date(returnDate.value);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const listing = listings.value.find((l) => l.id === listingId);
    const totalPrice = days * listing!.price_per_day;

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          borrowerId: user.value.id,
          startDate: borrowDate.value,
          endDate: returnDate.value,
          totalPrice,
        }),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      alert("Book borrowed successfully!");
      selectedListing.value = null;
      const listRes = await fetch(`${API_URL}/listings`);
      listings.value = await listRes.json();
    } catch (e: any) {
      alert(e.message);
    }
  });

  if (loading.value) {
    return (
      <div class="flex justify-center items-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error: {error.value}
      </div>
    );
  }

  return (
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Browse Available Books</h1>
        <p class="mt-2 text-gray-600">
          Find and borrow books from our community library
        </p>
      </div>

      {!user.value && (
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800">
            <a href="/login" class="underline font-medium">Login</a> to borrow books or <a href="/login" class="underline font-medium">create an account</a>
          </p>
        </div>
      )}

      {listings.value.length === 0 ? (
        <div class="text-center py-12 bg-white rounded-lg shadow">
          <p class="text-gray-500 text-lg">No books available for lending yet.</p>
          <a
            href="/add-book/"
            class="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Be the first to list a book →
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.value.map((listing) => (
            <div
              key={listing.id}
              class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div class="h-48 bg-gray-200 flex items-center justify-center">
                {listing.cover_image ? (
                  <img
                    src={listing.cover_image}
                    alt={listing.title}
                    class="w-full h-full object-cover"
                    width="200"
                    height="192"
                  />
                ) : (
                  <span class="text-6xl text-gray-400">📚</span>
                )}
              </div>
              <div class="p-4">
                <h2 class="font-semibold text-lg text-gray-900 truncate">
                  {listing.title}
                </h2>
                <p class="text-sm text-gray-600 mt-1">{listing.author}</p>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-indigo-600 font-bold">
                    ${(listing.price_per_day / 100).toFixed(2)}/day
                  </span>
                  <button
                    onClick$={() => (selectedListing.value = listing.id)}
                    class="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Borrow
                  </button>
                </div>
              </div>

              {selectedListing.value === listing.id && (
                <div class="p-4 bg-gray-50 border-t">
                  <p class="text-sm font-medium text-gray-700 mb-2">
                    Borrow this book
                  </p>
                  <div class="space-y-2">
                    <div>
                      <label class="block text-xs text-gray-500">Start Date</label>
                      <input
                        type="date"
                        bind:value={borrowDate}
                        class="w-full mt-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500">Return Date</label>
                      <input
                        type="date"
                        bind:value={returnDate}
                        class="w-full mt-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div class="flex gap-2">
                      <button
                        onClick$={() => handleBorrow(listing.id)}
                        class="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick$={() => (selectedListing.value = null)}
                        class="flex-1 px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Browse Books - WorldLibrary",
  meta: [
    {
      name: "description",
      content: "Browse and borrow books from WorldLibrary community",
    },
  ],
};
