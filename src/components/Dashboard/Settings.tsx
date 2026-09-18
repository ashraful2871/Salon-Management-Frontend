/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Store, Bell, Shield, Wallet, Loader2 } from "lucide-react";
import { changePassword } from "@/services/auth/changePassword";
import { toast } from "sonner";
import { updateSalon } from "@/services/salon/updateSalon";
import { toTaka } from "@/lib/money";

const Settings = ({ salon }: { salon?: any }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const [deposit, setDeposit] = useState(salon?.depositMinor ? toTaka(salon.depositMinor).toString() : "30");
  const [cancelWindow, setCancelWindow] = useState(salon?.cancellationWindowMin?.toString() || "120");
  const [isPolicyPending, startPolicyTransition] = useTransition();

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      const res = await changePassword(currentPassword, newPassword);
      if (res?.success) {
        toast.success(res?.message || "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res?.message || "Failed to update password");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-serif text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your salon preferences and account settings
        </p>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
                <Bell className="h-5 w-5 text-gold" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                label: "Email notifications",
                description: "Receive booking confirmations via email",
                defaultChecked: true,
              },
              {
                label: "SMS notifications",
                description: "Get text messages for new bookings",
                defaultChecked: true,
              },
              {
                label: "Push notifications",
                description: "Browser notifications for updates",
                defaultChecked: false,
              },
              {
                label: "Marketing emails",
                description: "Receive tips and promotional content",
                defaultChecked: false,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security / Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/20">
                <Shield className="h-5 w-5 text-sage" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Update Password"}
            </Button>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-factor authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {salon && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Booking Policy</CardTitle>
                  <CardDescription>
                    Manage deposits and cancellation windows
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                Customers pay a deposit upfront to hold their slot. It comes off their bill when they arrive. If they don't show up, you keep a portion of it.
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="depositMinor">Deposit Amount (৳)</Label>
                  <Input
                    id="depositMinor"
                    type="number"
                    min="20"
                    max="500"
                    placeholder="30"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Default is ৳30.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationWindowMin">Free Cancellation Window (minutes)</Label>
                  <Input
                    id="cancellationWindowMin"
                    type="number"
                    min="0"
                    placeholder="120"
                    value={cancelWindow}
                    onChange={(e) => setCancelWindow(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Free cancel up to {cancelWindow} mins before.</p>
                </div>
              </div>
              <Button
                variant="default"
                disabled={isPolicyPending}
                onClick={() => {
                  startPolicyTransition(async () => {
                    const fd = new FormData();
                    fd.append("id", salon.id);
                    fd.append("name", salon.name);
                    fd.append("depositMinor", deposit);
                    fd.append("cancellationWindowMin", cancelWindow);
                    const res = await updateSalon(null, fd);
                    if (res?.success) {
                      toast.success("Booking policy updated successfully");
                    } else {
                      toast.error(res?.message || "Failed to update booking policy");
                    }
                  });
                }}
              >
                {isPolicyPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isPolicyPending ? "Saving..." : "Save Policy"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" className="text-white font-bold">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
