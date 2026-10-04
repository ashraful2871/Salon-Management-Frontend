import type { AuthMe } from "@/services/auth/getMe";
import type { User, UserStatus } from "@/lib/api-types";
import React from "react";
import Image from "next/image";
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Phone,
  CalendarDays,
  Activity,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { Button } from "@/components/ui/button";

interface MyProfileProps {
  profile: AuthMe & User;
}

export default function MyProfile({ profile }: MyProfileProps) {
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email.charAt(0).toUpperCase();

  const formattedRole = profile.role
    ? profile.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "User";

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not available";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and account settings"
        actions={<Button>Save Changes</Button>}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
            <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-semibold text-primary-foreground shadow-sm">
              {profile.profilePhoto ? (
                <Image
                  src={profile.profilePhoto}
                  alt={profile.name || "Profile"}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {profile.name || "Unknown User"}
            </h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {formattedRole}
            </div>

            <div className="mt-6 w-full">
              <Button variant="outline" className="w-full">
                Edit Photo
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info & Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details Card */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-6 font-display text-lg font-semibold text-foreground">
              Account Details
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Full Name
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.name || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Email Address
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Phone Number
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.phoneNumber || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Gender
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.gender?.toLowerCase() || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Member Since
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    Account Status
                  </p>
                  <div className="pt-1">
                    {(() => {
                      const status = profile.status?.toUpperCase() || "ACTIVE";
                      let colorClass = "bg-success-soft text-success";

                      if (status === "INACTIVE") {
                        colorClass = "bg-warning-soft text-warning";
                      } else if (
                        ["SUSPENDED", "DELETED", "BLOCKED"].includes(status)
                      ) {
                        colorClass = "bg-danger-soft text-danger";
                      }

                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize shadow-sm ${colorClass}`}
                        >
                          {status.toLowerCase()}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Authentication Card */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-6 font-display text-lg font-semibold text-foreground">
              Security
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Key className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      Password
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.hasPassword
                        ? "You have a password set"
                        : "No password set"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {profile.hasPassword ? "Change" : "Set Password"}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium leading-none text-foreground">
                      Sign-in Methods
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.signInMethods?.map((method) => {
                        if (method === "PASSWORD") {
                          return (
                            <span
                              key={method}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >
                              <Key className="h-3 w-3" />
                              Password
                            </span>
                          );
                        }
                        if (method === "GOOGLE") {
                          return (
                            <span
                              key={method}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24">
                                <path
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  fill="#34A853"
                                />
                                <path
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  fill="#EA4335"
                                />
                              </svg>
                              Google
                            </span>
                          );
                        }
                        return (
                          <span
                            key={method}
                            className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {method}
                          </span>
                        );
                      })}
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
