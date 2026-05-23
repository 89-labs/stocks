"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const inputCls =
  "rounded-lg border border-border bg-input-bg px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function PortfolioActions() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ticker: "",
    type: "BUY" as "BUY" | "SELL",
    quantity: 0,
    price: 0,
    fees: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async () => {
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    window.location.reload();
  };

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4" />
        Add Transaction
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card-bg p-4">
      <input
        placeholder="Ticker"
        value={form.ticker}
        onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
        className={inputCls}
      />
      <select
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value as "BUY" | "SELL" })}
        className={inputCls}
      >
        <option value="BUY">Buy</option>
        <option value="SELL">Sell</option>
      </select>
      <input
        type="number"
        placeholder="Qty"
        value={form.quantity || ""}
        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        className={`${inputCls} w-20`}
      />
      <input
        type="number"
        placeholder="Price"
        value={form.price || ""}
        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        className={`${inputCls} w-24`}
      />
      <input
        type="number"
        placeholder="Fees"
        value={form.fees || ""}
        onChange={(e) => setForm({ ...form, fees: Number(e.target.value) })}
        className={`${inputCls} w-20`}
      />
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        className={inputCls}
      />
      <Button size="sm" onClick={handleSubmit}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
        Cancel
      </Button>
    </div>
  );
}
