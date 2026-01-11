"use client";
import { logOutUser } from "@/services/auth/logoutUser";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const handleLogout = async () => {
    await logOutUser();
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-red-500 hover:text-red-600"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" /> Log out
    </Button>
  );
};

export default LogoutButton;
