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
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser.value) {
    return (
      <div class="text-center py-12">
        <p class="text-gray-600 mb-4">Please login to add books</p>
        <a
          href="/login"
          class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Login
        </a>
      </div>
    );
  }

  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Add a New Book</h1>
      <p class="text-gray-600 mb-8">
        List your book for others to borrow
      </p>

      {success.value && (
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Book listed successfully! You can add another one.
        </div>
      )}

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="space-y-6">
          <div class="p-3 bg-gray-50 rounded-md">
            <p class="text-sm text-gray-600">Adding as: <span class="font-medium">{currentUser.value.name}</span></p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Book Title *
            </label>
            <input
              type="text"
              value={title.value}
              onInput$={(e) => (title.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter book title"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Author *
            </label>
            <input
              type="text"
              value={author.value}
              onInput$={(e) => (author.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter author name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ISBN (optional)
            </label>
            <input
              type="text"
              value={isbn.value}
              onInput$={(e) => (isbn.value = (e.target as HTMLInputElement).value)}
              placeholder="Enter ISBN"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cover Image (optional)
            </label>
            <FileUpload
              fileType="image"
              value={coverImage.value}
              onChange$={(url) => (coverImage.value = url)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Price per Day (USD) *
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick$={handleSubmit}
            disabled={submitting.value}
            class="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {submitting.value ? "Listing Book..." : "List Book for Lending"}
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
