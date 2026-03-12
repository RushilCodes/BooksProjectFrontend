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
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800 shadow-sm">
        <strong>Error:</strong> {error.value}
      </div>
    );
  }

  return (
    <div>
      <div class="mb-8">
        <h1 class="text-4xl font-serif font-bold text-library-900 mb-2">📖 Browse Available Books</h1>
        <p class="text-lg text-library-700">
          Discover and borrow books from our community library
        </p>
      </div>

      {!user.value && (
        <div class="mb-6 p-4 bg-accent-50 border-2 border-accent-200 rounded-lg shadow-sm">
          <p class="text-accent-900 font-medium">
            🔑 <a href="/login" class="underline font-semibold hover:text-accent-700">Login</a> to borrow books or <a href="/login" class="underline font-semibold hover:text-accent-700">create an account</a>
          </p>
        </div>
      )}

      {listings.value.length === 0 ? (
        <div class="text-center py-16 bg-library-50 rounded-lg shadow-md border-2 border-library-200 paper-texture">
          <div class="text-6xl mb-4">📚</div>
          <p class="text-library-700 text-lg font-medium mb-2">No books available for lending yet.</p>
          <p class="text-library-600 mb-4">Be part of our reading community</p>
          <a
            href="/add-book/"
            class="inline-block px-6 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 shadow-md hover:shadow-lg transition-all"
          >
            List Your First Book →
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.value.map((listing) => (
            <div
              key={listing.id}
              class="book-card bg-library-50 rounded-lg overflow-hidden book-spine"
            >
              <div class="h-56 bg-gradient-to-br from-library-200 to-library-300 flex items-center justify-center relative overflow-hidden">
                {listing.cover_image ? (
                  <img
                    src={listing.cover_image}
                    alt={listing.title}
                    class="w-full h-full object-cover"
                    width="200"
                    height="224"
                  />
                ) : (
                  <div class="flex flex-col items-center">
                    <span class="text-7xl text-library-600 opacity-60">📖</span>
                  </div>
                )}
                <div class="absolute top-2 right-2 bg-accent-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                  ${(listing.price_per_day / 100).toFixed(2)}/day
                </div>
              </div>
              <div class="p-5">
                <h2 class="font-serif font-bold text-lg text-library-900 line-clamp-2 mb-1">
                  {listing.title}
                </h2>
                <p class="text-sm text-library-600 italic mb-3">by {listing.author}</p>
                <button
                  onClick$={() => (selectedListing.value = listing.id)}
                  class="w-full py-2 bg-accent-600 text-white text-sm font-semibold rounded-md hover:bg-accent-700 transition-all shadow-sm hover:shadow-md"
                >
                  📖 Borrow Now
                </button>
              </div>

              {selectedListing.value === listing.id && (
                <div class="p-4 bg-library-100 border-t-2 border-library-300">
                  <p class="text-sm font-semibold text-library-900 mb-3">
                    📅 Select Borrowing Period
                  </p>
                  <div class="space-y-3">
                    <div>
                      <label class="block text-xs font-medium text-library-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        bind:value={borrowDate}
                        class="w-full px-3 py-2 border-2 border-library-300 rounded-md text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-library-700 mb-1">Return Date</label>
                      <input
                        type="date"
                        bind:value={returnDate}
                        class="w-full px-3 py-2 border-2 border-library-300 rounded-md text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 outline-none"
                      />
                    </div>
                    <div class="flex gap-2 pt-2">
                      <button
                        onClick$={() => handleBorrow(listing.id)}
                        class="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 shadow-sm hover:shadow-md transition-all"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick$={() => (selectedListing.value = null)}
                        class="flex-1 px-4 py-2 bg-library-400 text-white text-sm font-semibold rounded-md hover:bg-library-500 shadow-sm transition-all"
                      >
                        × Cancel
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
