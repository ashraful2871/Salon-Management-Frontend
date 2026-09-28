import { DashboardSkeleton } from "@/components/Shared/SkeletonCard";

// Rendered inside the layout, which already draws the sidebar and top bar:
// only the content area needs a placeholder.
export default function DashboardLayoutLoading() {
  return <DashboardSkeleton />;
}
