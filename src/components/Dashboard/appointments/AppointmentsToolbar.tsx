"use client";

import { useState } from "react";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PendingBar } from "@/components/Shared/PendingRegion";
import { DateStepper } from "./DateStepper";

export type AppointmentFilters = {
  date: string | null; // YYYY-MM-DD, or null for every date
  status: string; // an appointment status, or "ALL"
  searchTerm: string;
};

/**
 * Search and the day on one row, status pills with counts under it (on a
 * phone: search, pills, then the day). The pressed pill and the day are the
 * active filters, so there is no separate summary of them.
 */
export const AppointmentsToolbar = ({
  filters,
  statusOptions,
  onChange,
}: {
  filters: AppointmentFilters;
  statusOptions: FilterChip[];
  onChange: (patch: Partial<AppointmentFilters>) => void;
}) => {
  // Typed locally and sent on Enter; re-synced when the URL changes under it
  // (Clear, the back button).
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [syncedSearch, setSyncedSearch] = useState(filters.searchTerm);
  if (syncedSearch !== filters.searchTerm) {
    setSyncedSearch(filters.searchTerm);
    setSearchInput(filters.searchTerm);
  }

  // The day has its own controls; Clear resets what the bar owns.
  const activeCount =
    (filters.status !== "ALL" ? 1 : 0) + (filters.searchTerm ? 1 : 0);

  return (
    <div className="relative">
      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          onSubmit: (searchTerm) => onChange({ searchTerm }),
          placeholder: "Name, phone or token",
          label: "Search bookings by name, phone or token",
        }}
        chips={{
          value: filters.status,
          options: statusOptions,
          onChange: (status) => onChange({ status }),
          label: "Status",
        }}
        aside={<DateStepper date={filters.date} onChange={(date) => onChange({ date })} />}
        activeCount={activeCount}
        onClear={() => {
          setSearchInput("");
          onChange({ status: "ALL", searchTerm: "" });
        }}
      />
      {/* Sits in the gap below the toolbar, so showing it moves nothing. */}
      <PendingBar className="absolute inset-x-4 top-full mt-2" />
    </div>
  );
};
