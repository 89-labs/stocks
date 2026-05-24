"use client";

import { useState, useTransition, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  updateUserProfile,
  updateDisplayPreferences,
  clearResearchHistory,
  deleteAccount,
} from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";
import type { UserPrefs } from "@/lib/dashboard/user-preferences";
import { DashboardCard } from "@/components/dashboard/dashboard-ui";

const TABS = [
  { id: "profile", label: "Profile", description: "Name, email, and membership" },
  { id: "display", label: "Display", description: "Theme, timeframe, and formatting" },
  { id: "watchlist", label: "Watchlist & data", description: "Exports and research history" },
  { id: "notifications", label: "Notifications", description: "Alerts and briefs" },
  { id: "account", label: "Account", description: "Sign out and deletion" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SettingsFormProps {
  email: string;
  createdAt: string;
  prefs: UserPrefs;
  watchlistCount: number;
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-6 last:border-0 last:pb-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 sm:max-w-md">
        <p className="text-sm font-medium text-neutral-heading">{label}</p>
        {hint && (
          <p className="mt-1 text-sm leading-relaxed text-neutral-secondary">{hint}</p>
        )}
      </div>
      <div className="shrink-0 sm:min-w-[220px] sm:text-right">{children}</div>
    </div>
  );
}

export function SettingsForm({
  email,
  createdAt,
  prefs: initialPrefs,
  watchlistCount,
}: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [displayName, setDisplayName] = useState(initialPrefs.displayName ?? "");
  const [editingName, setEditingName] = useState(false);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [pending, startTransition] = useTransition();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const activeMeta = TABS.find((t) => t.id === activeTab);

  const saveProfile = () => {
    startTransition(async () => {
      await updateUserProfile(displayName);
      setEditingName(false);
    });
  };

  const savePrefs = (updates: Partial<UserPrefs>) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    startTransition(async () => {
      await updateDisplayPreferences({
        defaultTimeframe: next.defaultTimeframe,
        currencyDisplay: next.currencyDisplay,
        numberFormat: next.numberFormat,
      });
    });
  };

  const exportCsv = async () => {
    const { exportWatchlistCsv } = await import("@/lib/dashboard/actions");
    const csv = await exportWatchlistCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watchlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    startTransition(async () => {
      await clearResearchHistory();
      setShowClearModal(false);
    });
  };

  const handleDeleteAccount = () => {
    startTransition(async () => {
      await deleteAccount(deleteConfirm);
      await signOut({ callbackUrl: "/" });
    });
  };

  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-input-bg sm:w-auto sm:min-w-[200px]";

  return (
    <div className="space-y-8">
      <DashboardCard className="p-2 sm:p-3">
        <nav
          className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Settings sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-emerald-50 text-[#00A651] shadow-sm dark:bg-emerald-950/60"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </DashboardCard>

      <div className="min-h-[28rem]">
        {activeMeta && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-heading">
              {activeMeta.label}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-secondary">
              {activeMeta.description}
            </p>
          </div>
        )}

        {activeTab === "profile" && (
          <DashboardCard className="p-8 sm:p-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {displayName.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-6">
                <SettingRow label="Display name" hint="Shown across the dashboard and in exports.">
                  <div className="flex flex-col items-stretch gap-3 sm:items-end">
                    {editingName ? (
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={cn(selectClass, "sm:min-w-[280px]")}
                        autoFocus
                      />
                    ) : (
                      <p className="text-base font-semibold text-neutral-heading sm:text-right">
                        {displayName || "Set display name"}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (editingName ? saveProfile() : setEditingName(true))}
                        disabled={pending}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        {editingName ? "Save name" : "Edit name"}
                      </Button>
                      {editingName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDisplayName(initialPrefs.displayName ?? "");
                            setEditingName(false);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </SettingRow>
                <SettingRow label="Email" hint="Used for sign-in; cannot be changed here.">
                  <p className="text-sm font-medium text-neutral-heading sm:text-right">{email}</p>
                </SettingRow>
                <SettingRow label="Member since">
                  <p className="text-sm text-neutral-secondary sm:text-right">
                    {new Date(createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </SettingRow>
              </div>
            </div>
          </DashboardCard>
        )}

        {activeTab === "display" && (
          <DashboardCard className="p-8 sm:p-10">
            <SettingRow label="Dark mode" hint="Toggle light and dark appearance.">
              <ThemeToggle />
            </SettingRow>
            <SettingRow
              label="Default timeframe"
              hint="Pre-selected range on stock charts across the app."
            >
              <select
                value={prefs.defaultTimeframe}
                onChange={(e) =>
                  savePrefs({
                    defaultTimeframe: e.target.value as UserPrefs["defaultTimeframe"],
                  })
                }
                className={selectClass}
              >
                {(["1D", "1W", "1M", "3M", "1Y"] as const).map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Currency display" hint="How prices are shown in tables and cards.">
              <select
                value={prefs.currencyDisplay}
                onChange={(e) =>
                  savePrefs({
                    currencyDisplay: e.target.value as UserPrefs["currencyDisplay"],
                  })
                }
                className={selectClass}
              >
                <option value="NGN">NGN only</option>
                <option value="NGN_USD">NGN + USD equivalent</option>
              </select>
            </SettingRow>
            <SettingRow label="Number format" hint="Compact vs full notation for large values.">
              <select
                value={prefs.numberFormat}
                onChange={(e) =>
                  savePrefs({
                    numberFormat: e.target.value as UserPrefs["numberFormat"],
                  })
                }
                className={selectClass}
              >
                <option value="full">₦1,234,567.00</option>
                <option value="compact">₦1.23M</option>
              </select>
            </SettingRow>
          </DashboardCard>
        )}

        {activeTab === "watchlist" && (
          <DashboardCard className="p-8 sm:p-10">
            <SettingRow
              label="Watchlist size"
              hint="Stocks you are tracking from the watchlist page."
            >
              <span className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {watchlistCount} stock{watchlistCount !== 1 ? "s" : ""}
              </span>
            </SettingRow>
            <SettingRow
              label="Export watchlist"
              hint="Download your tickers as a CSV file."
            >
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export CSV
              </Button>
            </SettingRow>
            <SettingRow
              label="Research history"
              hint="Clears your stock visit records from the dashboard."
            >
              <Button variant="outline" onClick={() => setShowClearModal(true)}>
                Clear history
              </Button>
            </SettingRow>
          </DashboardCard>
        )}

        {activeTab === "notifications" && (
          <DashboardCard className="p-8 sm:p-10">
            {["Price alerts", "Market open reminder", "Daily AI brief"].map((label) => (
              <SettingRow
                key={label}
                label={label}
                hint="Notification delivery is not enabled yet."
              >
                <div className="flex items-center justify-end gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Coming soon
                  </span>
                  <input type="checkbox" disabled className="h-4 w-4 opacity-50" />
                </div>
              </SettingRow>
            ))}
          </DashboardCard>
        )}

        {activeTab === "account" && (
          <DashboardCard className="p-8 sm:p-10">
            <SettingRow
              label="Sign out"
              hint="End your session on this device."
            >
              <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </SettingRow>
            <SettingRow
              label="Delete account"
              hint="Permanently removes your profile, watchlist, and preferences."
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Delete account…
              </button>
            </SettingRow>
          </DashboardCard>
        )}
      </div>

      {showClearModal && (
        <Modal onClose={() => setShowClearModal(false)}>
          <h3 className="font-semibold text-neutral-heading">Clear research history?</h3>
          <p className="mt-2 text-sm text-neutral-secondary">
            This will permanently delete all your stock visit records.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={pending}>
              Clear history
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <h3 className="font-semibold text-neutral-heading">Delete account</h3>
          <p className="mt-2 text-sm text-neutral-secondary">
            This permanently deletes all your data. Type DELETE to confirm.
          </p>
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-input-bg"
            placeholder="DELETE"
          />
          <div className="mt-6 flex gap-3">
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirm !== "DELETE" || pending}
              onClick={handleDeleteAccount}
            >
              Delete account
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-card-bg">
        {children}
      </div>
    </div>
  );
}
