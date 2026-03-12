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

  const transactions = activeTab.value === "borrowing" ? borrowing : lending;

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
              <option value={user.id}>
                {`${user.name} (${user.email || 'no email'})`}
              </option>
          ))}
        </select>
      </div>

      <div class="mb-6 flex gap-4">
        <button
          onClick$={() => activeTab.value = "borrowing"}
          class={`px-4 py-2 rounded-md font-medium ${
            activeTab.value === "borrowing"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Borrowing
        </button>
        <button
          onClick$={() => activeTab.value = "lending"}
          class={`px-4 py-2 rounded-md font-medium ${
            activeTab.value === "lending"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Lending
        </button>
      </div>

      <div class="space-y-4">
        {transactions.value.length === 0 ? (
          <p class="text-gray-500 text-center py-8">No transactions yet.</p>
        ) : (
          transactions.value.map((tx) => (
            <div
              key={tx.id}
              class="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-2xl">
                  📖
                </div>
                <div>
                  <h2 class="font-semibold text-lg text-gray-900">
                    {tx.title}
                  </h2>
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
            </div>
          ))
        )}
      </div>
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
