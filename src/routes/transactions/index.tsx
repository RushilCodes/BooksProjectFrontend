import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { API_URL } from "~/context/auth";

interface Transaction {
  id: string;
  listing_id: string;
  borrower_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  title: string;
}

interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
}

export default component$(() => {
  const borrowing = useSignal<Transaction[]>([]);
  const lending = useSignal<Transaction[]>([]);
  const loading = useSignal(true);
  const selectedUserId = useSignal("");
  const allUsers = useSignal<User[]>([]);
  const activeTab = useSignal<"borrowing" | "lending">("borrowing");

  useVisibleTask$(async () => {
    try {
      const usersRes = await fetch(`${API_URL}/users`);
      allUsers.value = await usersRes.json();
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        selectedUserId.value = user.id;
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
        const res = await fetch(
          `${API_URL}/users/${selectedUserId.value}/transactions`
        );
        const data = await res.json();
        borrowing.value = data.asBorrower || [];
        lending.value = data.asOwner || [];
      } catch (e) {
        console.error("Failed to fetch transactions:", e);
      } finally {
        loading.value = false;
      }
    },
    { strategy: "document-ready" }
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
      <p class="text-gray-600 mb-8">View your borrowing and lending history</p>

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

      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              onClick$={() => (activeTab.value = "borrowing")}
              class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab.value === "borrowing"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Borrowing ({borrowing.value.length})
            </button>
            <button
              onClick$={() => (activeTab.value = "lending")}
              class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab.value === "lending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Lending ({lending.value.length})
            </button>
          </nav>
        </div>
      </div>

      {loading.value ? (
        <div class="flex justify-center items-center min-h-[300px]">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div class="space-y-4">
          {(activeTab.value === "borrowing"
            ? borrowing.value
            : lending.value
          ).length === 0 ? (
            <div class="text-center py-12 bg-white rounded-lg shadow">
              <p class="text-gray-500 text-lg">
                No {activeTab.value} transactions yet.
              </p>
              {activeTab.value === "borrowing" && (
                <a
                  href="/"
                  class="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Browse available books →
                </a>
              )}
            </div>
          ) : (
            (activeTab.value === "borrowing"
              ? borrowing.value
              : lending.value
            ).map((tx) => (
              <div
                key={tx.id}
                class="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-2xl">
                    📖
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg text-gray-900">
                      {tx.title}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">
                      {formatDate(tx.start_date)} - {formatDate(tx.end_date)}
                    </p>
                    <div class="mt-2 flex items-center gap-3">
                      <span
                        class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                      <span class="text-sm text-gray-600">
                        Total:{" "}
                        <span class="font-medium text-indigo-600">
                          ${(tx.total_price / 100).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Transactions - WorldLibrary",
  meta: [
    {
      name: "description",
      content: "View your borrowing and lending transactions on WorldLibrary",
    },
  ],
};
