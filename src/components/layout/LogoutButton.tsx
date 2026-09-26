"use client";
import { logOutUser } from "@/services/auth/logoutUser";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const LogoutButton = ({
  iconOnly = false,
  className,
}: {
  /** The collapsed dashboard sidebar: just the icon, the label for screen readers. */
  iconOnly?: boolean;
  className?: string;
}) => {
  const handleLogout = async () => {
    await logOutUser();
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      title={iconOnly ? "Log out" : undefined}
      className={cn(
        "w-full cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600",
        iconOnly ? "justify-center px-0" : "justify-start",
        className,
      )}
      onClick={handleLogout}
    >
      <LogOut className={cn("h-4 w-4", !iconOnly && "mr-2")} />
      {iconOnly ? <span className="sr-only">Log out</span> : "Log out"}
    </Button>
  );
};

export default LogoutButton;
