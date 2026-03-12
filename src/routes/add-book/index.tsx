import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";
import { FileUpload } from "~/components/upload/file-upload";

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
}

export default component$(() => {
  const title = useSignal("");
  const author = useSignal("");
  const isbn = useSignal("");
  const coverImage = useSignal("");
  const pricePerDay = useSignal(1);
  const currentUser = useSignal<User | null>(null);
  const loading = useSignal(true);
  const submitting = useSignal(false);
  const success = useSignal(false);

  useVisibleTask$(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        currentUser.value = JSON.parse(storedUser);
      } else {
        const usersRes = await fetch(`${API_URL}/users`);
        const users = await usersRes.json();
        if (users.length > 0) {
          currentUser.value = users[0];
        }
      }
    } catch (e) {
      console.error("Failed to fetch user:", e);
    } finally {
      loading.value = false;
    }
  });

  const handleSubmit = $(async () => {
    if (!currentUser.value) {
      window.location.href = "/login";
      return;
    }

    if (!title.value || !author.value) {
      alert("Please fill in all required fields");
      return;
    }

    submitting.value = true;

    try {
      const bookRes = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.value,
          author: author.value,
          isbn: isbn.value || null,
          coverImage: coverImage.value || null,
          ownerId: currentUser.value.id,
        }),
      });

      if (!bookRes.ok) throw new Error("Failed to create book");

      const book = await bookRes.json();

      const listingRes = await fetch(`${API_URL}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          pricePerDay: pricePerDay.value * 100,
        }),
      });

      if (!listingRes.ok) throw new Error("Failed to create listing");

      success.value = true;
      title.value = "";
      author.value = "";
      isbn.value = "";
      coverImage.value = "";
      pricePerDay.value = 1;

      setTimeout(() => (success.value = false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      submitting.value = false;
    }
  });

  if (loading.value) {
    return (
      <div class="flex justify-center items-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (!currentUser.value) {
    return (
      <div class="text-center py-16 bg-library-50 rounded-lg shadow-md border-2 border-library-200">
        <div class="text-6xl mb-4">🔒</div>
        <p class="text-library-700 text-lg font-medium mb-6">Please login to add books</p>
        <a
          href="/login"
          class="inline-block px-6 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 shadow-md hover:shadow-lg transition-all"
        >
          Login Now
        </a>
      </div>
    );
  }

  return (
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-serif font-bold text-library-900 mb-2">📚 Add a New Book</h1>
        <p class="text-lg text-library-700">
          Share your books with the community
        </p>
      </div>

      {success.value && (
        <div class="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-green-800 shadow-sm">
          <strong>✓ Success!</strong> Book listed successfully! You can add another one.
        </div>
      )}

      <div class="bg-library-50 rounded-lg shadow-lg p-8 border-2 border-library-200 paper-texture">
        <div class="space-y-6">
          <div class="p-4 bg-library-100 rounded-lg border border-library-300 shadow-sm">
            <p class="text-sm text-library-700">👤 Adding as: <span class="font-semibold text-library-900">{currentUser.value.name}</span></p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-library-800 mb-2">
              📖 Book Title *
            </label>
            <input
              type="text"
              value={title.value}
              onInput$={(e) => (title.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter book title"
              class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-library-800 mb-2">
              ✍️ Author *
            </label>
            <input
              type="text"
              value={author.value}
              onInput$={(e) => (author.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter author name"
              class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-library-800 mb-2">
              🔢 ISBN (optional)
            </label>
            <input
              type="text"
              value={isbn.value}
              onInput$={(e) => (isbn.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter ISBN"
              class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-library-800 mb-2">
              🖼️ Cover Image (optional)
            </label>
            <FileUpload
              fileType="image"
              value={coverImage.value}
              onChange$={(url) => (coverImage.value = url)}
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-library-800 mb-2">
              💵 Price per Day (USD) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={pricePerDay.value}
              onInput$={(e) =>
                (pricePerDay.value = parseFloat(
                  (e.target as HTMLInputElement).value
                ) || 0)
              }
              class="w-full px-4 py-3 border-2 border-library-300 rounded-md focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 bg-white"
            />
          </div>

          <button
            onClick$={handleSubmit}
            disabled={submitting.value}
            class="w-full py-4 bg-accent-600 text-white font-bold text-lg rounded-md hover:bg-accent-700 transition-all shadow-md hover:shadow-lg disabled:bg-library-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting.value ? "⏳ Listing Book..." : "✓ List Book for Lending"}
          </button>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Add Book - WorldLibrary",
  meta: [
    {
      name: "description",
      content: "Add a new book to WorldLibrary for lending",
    },
  ],
};
