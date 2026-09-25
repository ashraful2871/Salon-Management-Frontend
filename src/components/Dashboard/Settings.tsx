/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Bell, Shield, Wallet, Loader2, Mail, KeyRound } from "lucide-react";
import { changePassword } from "@/services/auth/changePassword";
import { confirmEmailChange, requestEmailChange } from "@/services/auth/changeEmail";
import type { SignInMethod } from "@/services/auth/getMe";
import { GoogleLogo } from "@/components/Auth/GoogleButton";
import { toast } from "sonner";
import { updateSalon } from "@/services/salon/updateSalon";
import { toTaka } from "@/lib/money";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `signIn` comes from `/auth/me`; null when that call failed, and then the
 * Security card shows the password form as it always did.
 */
const Settings = ({
  salon,
  currentEmail = "",
  signIn = null,
}: {
  salon?: any;
  currentEmail?: string;
  signIn?: { hasPassword: boolean; signInMethods: SignInMethod[] } | null;
}) => {
  // A Google-only account has no current password to type, so it gets a link
  // to set one by email instead of the change-password form.
  const hasPassword = signIn?.hasPassword ?? true;
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState(currentEmail);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [isEmailPending, startEmailTransition] = useTransition();

  // Step 2 of the email change: set once a code has gone to the new address.
  const [emailCode, setEmailCode] = useState<{ to: string; masked: string; resendAt: number } | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // Null until mounted and only ticking on the code step; set from timer
  // callbacks, never in the effect body.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!emailCode) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [emailCode]);

  const resendLeft =
    emailCode && now !== null ? Math.max(0, Math.ceil((emailCode.resendAt - now) / 1000)) : null;

  const sendEmailCode = (target: string) => {
    startEmailTransition(async () => {
      const res = await requestEmailChange(target, hasPassword ? emailPassword : undefined);
      if (res?.success && res.data) {
        toast.success(res.message || "We sent a code to your new email");
        setEmailCode({
          to: target,
          masked: res.data.maskedEmail,
          resendAt: Date.now() + res.data.resendIn * 1000,
        });
        setCode("");
        setCodeError(null);
      } else {
        const wait = Number(res?.details?.retryAfter);
        toast.error(
          res?.errorCode === "OTP_THROTTLED" && wait > 0
            ? `Please wait ${wait} seconds before requesting another code`
            : res?.message || "Failed to send the code",
        );
      }
    });
  };

  const handleChangeEmail = () => {
    const trimmed = newEmail.trim();

    if (!trimmed || (hasPassword && !emailPassword)) {
      toast.error(
        hasPassword
          ? "Please enter your new email and current password"
          : "Please enter your new email",
      );
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (trimmed.toLowerCase() === email.toLowerCase()) {
      toast.error("New email must be different from your current email");
      return;
    }

    sendEmailCode(trimmed);
  };

  const cancelEmailChange = () => {
    setEmailCode(null);
    setCode("");
    setCodeError(null);
  };

  const confirmCode = (value: string) => {
    if (value.length !== 6 || !emailCode) return;

    startEmailTransition(async () => {
      const res = await confirmEmailChange(value);
      if (res?.success) {
        toast.success(res.message || "Your email has been changed");
        setEmail(res.data?.email || emailCode.to);
        setNewEmail("");
        setEmailPassword("");
        cancelEmailChange();
        // The session cookie now carries the new address; re-render the
        // server components (navbar, sidebar) that read it.
        router.refresh();
      } else {
        setCode("");
        setCodeError(res?.message || "That code didn't work");
      }
    });
  };

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
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
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

      {/* Email Address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose/20">
                <Mail className="h-5 w-5 text-rose" />
              </div>
              <div>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>
                  Change the email you sign in with and receive updates at
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={email}
                readOnly
                disabled
              />
            </div>
            {emailCode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailCode">
                    Enter the 6-digit code we sent to{" "}
                    <span className="font-semibold">{emailCode.masked}</span>
                  </Label>
                  <InputOTP
                    id="emailCode"
                    maxLength={6}
                    inputMode="numeric"
                    pattern={REGEXP_ONLY_DIGITS}
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      if (codeError) setCodeError(null);
                    }}
                    onComplete={confirmCode}
                    disabled={isEmailPending}
                    aria-invalid={codeError ? true : undefined}
                    aria-describedby="emailCodeFeedback"
                  >
                    <InputOTPGroup>
                      {[0, 1, 2].map((i) => (
                        <InputOTPSlot key={i} index={i} aria-invalid={!!codeError} />
                      ))}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      {[3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} aria-invalid={!!codeError} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <p
                    id="emailCodeFeedback"
                    role="alert"
                    className="min-h-4 text-xs font-medium text-destructive"
                  >
                    {codeError}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your email changes once you enter the code. Other devices will
                  be signed out, and your current address gets a notice.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => confirmCode(code)}
                    disabled={isEmailPending || code.length !== 6}
                  >
                    {isEmailPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirm new email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendEmailCode(emailCode.to)}
                    disabled={isEmailPending || resendLeft !== 0}
                  >
                    {resendLeft ? `Resend in ${resendLeft}s` : "Resend code"}
                  </Button>
                  <Button variant="ghost" onClick={cancelEmailChange} disabled={isEmailPending}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${hasPassword ? "md:grid-cols-2" : ""}`}>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">Current Password</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  We will send a 6-digit code to the new address. Nothing changes
                  until you enter it.
                </p>
                <Button
                  variant="outline"
                  onClick={handleChangeEmail}
                  disabled={isEmailPending}
                >
                  {isEmailPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isEmailPending ? "Sending code..." : "Send code"}
                </Button>
              </>
            )}
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
            {signIn && (
              <>
                <div className="space-y-3">
                  <Label>Sign-in methods</Label>
                  <div className="divide-y rounded-lg border">
                    <div className="flex items-center justify-between gap-4 p-3">
                      <div className="flex items-center gap-3">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Email & password</span>
                      </div>
                      <span
                        className={`text-sm ${signIn.hasPassword ? "font-medium text-sage" : "text-muted-foreground"}`}
                      >
                        {signIn.hasPassword ? "Set" : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3">
                      <div className="flex items-center gap-3">
                        <GoogleLogo size={16} />
                        <span className="text-sm font-medium">Google</span>
                      </div>
                      <span
                        className={`text-sm ${signIn.signInMethods.includes("GOOGLE") ? "font-medium text-sage" : "text-muted-foreground"}`}
                      >
                        {signIn.signInMethods.includes("GOOGLE")
                          ? "Linked"
                          : "Not linked"}
                      </span>
                    </div>
                  </div>
                  {!hasPassword && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        You sign in with Google. Set a password to sign in
                        with your email too.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/forgot-password">Set a password</Link>
                      </Button>
                    </div>
                  )}
                </div>
                {hasPassword && <Separator className="my-4" />}
              </>
            )}
            {hasPassword && (
              <>
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
              </>
            )}
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
