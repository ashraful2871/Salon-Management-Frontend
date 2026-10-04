import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-64 lg:mt-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column Skeleton: Avatar & Basic Info */}
        <div className="md:col-span-1">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
            <Skeleton className="mb-4 h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-3 h-5 w-24 rounded-full" />
            
            <div className="mt-6 w-full">
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column Skeleton: Detailed Info & Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details Card Skeleton */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <Skeleton className="mb-6 h-6 w-40" />
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security & Authentication Card Skeleton */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <Skeleton className="mb-6 h-6 w-24" />
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
