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
        return "bg-green-100 text-green-800 border border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "completed":
        return "bg-library-200 text-library-800 border border-library-400";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-library-200 text-library-800 border border-library-400";
    }
  };

  return (
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-serif font-bold text-library-900 mb-2">📋 Transactions</h1>
      <p class="text-lg text-library-700 mb-8">View your borrowing and lending history</p>

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
              <option value={user.id}>
                {`${user.name} (${user.email || 'no email'})`}
              </option>
          ))}
        </select>
      </div>

      <div class="mb-6 flex gap-3 bg-library-100 p-2 rounded-lg border-2 border-library-200 inline-flex">
        <button
          onClick$={() => activeTab.value = "borrowing"}
          class={`px-6 py-3 rounded-md font-semibold transition-all shadow-sm ${
            activeTab.value === "borrowing"
              ? "bg-accent-600 text-white shadow-md"
              : "bg-library-50 text-library-800 hover:bg-white"
          }`}
        >
          📚 Borrowing
        </button>
        <button
          onClick$={() => activeTab.value = "lending"}
          class={`px-6 py-3 rounded-md font-semibold transition-all shadow-sm ${
            activeTab.value === "lending"
              ? "bg-accent-600 text-white shadow-md"
              : "bg-library-50 text-library-800 hover:bg-white"
          }`}
        >
          🤝 Lending
        </button>
      </div>

      <div class="space-y-4">
        {transactions.value.length === 0 ? (
          <div class="text-center py-16 bg-library-50 rounded-lg shadow-md border-2 border-library-200 paper-texture">
            <div class="text-6xl mb-4">📜</div>
            <p class="text-library-700 text-lg font-medium mb-2">No transactions yet.</p>
            <p class="text-library-600">Start borrowing or lending books to see your transaction history</p>
          </div>
        ) : (
          transactions.value.map((tx) => (
            <div
              key={tx.id}
              class="book-spine bg-library-50 rounded-lg shadow-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-library-200 hover:shadow-lg transition-shadow"
            >
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-library-200 to-library-300 rounded-md flex items-center justify-center text-3xl shadow-sm">
                  📖
                </div>
                <div>
                  <h2 class="font-serif font-bold text-lg text-library-900">
                    {tx.title}
                  </h2>
                  <p class="text-sm text-library-600 mt-1">
                    📅 {formatDate(tx.start_date)} - {formatDate(tx.end_date)}
                  </p>
                  <div class="mt-2 flex items-center gap-3">
                    <span
                      class={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>
                    <span class="text-sm text-library-700 font-medium">
                      Total:{" "}
                      <span class="font-bold text-accent-700 text-base">
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
