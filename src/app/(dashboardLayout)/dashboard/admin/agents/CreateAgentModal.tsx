"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import { toast } from "sonner";
import { serverFetch } from "@/lib/server-fetch";

export function CreateAgentModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    division: "",
    district: "",
    area: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await serverFetch.post("/agents/create", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create agent");
      }

      toast.success("Agent created successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>Assign an agent to a specific territory.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-6">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required value={form.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="min 6 characters" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Division</label>
                <select
                  name="division"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.division}
                  onChange={(e) => {
                    setForm(prev => ({
                      ...prev,
                      division: e.target.value,
                      district: "",
                      area: "",
                    }));
                  }}
                >
                  <option value="">Select</option>
                  {BANGLADESH_LOCATIONS.map(l => <option key={l.division} value={l.division}>{l.division}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">District</label>
                <select
                  name="district"
                  required
                  disabled={!form.division}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.district}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, district: e.target.value, area: "" }));
                  }}
                >
                  <option value="">Select</option>
                  {BANGLADESH_LOCATIONS.find(l => l.division === form.division)?.districts.map(d => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Area</label>
              <select
                name="area"
                required
                disabled={!form.district}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.area}
                onChange={handleChange}
              >
                <option value="">Select Area</option>
                {BANGLADESH_LOCATIONS.find(l => l.division === form.division)
                  ?.districts.find(d => d.district === form.district)
                  ?.areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Agent"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
