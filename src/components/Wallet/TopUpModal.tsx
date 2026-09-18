"use client";

import React, { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { initiateTopup } from "@/services/wallet/initiateTopup";
import { Loader2 } from "lucide-react";

const PRESET_AMOUNTS = [200, 500, 1000, 2000];

export default function TopUpModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) {
  const [amount, setAmount] = useState<string>("500");
  const [isPending, startTransition] = useTransition();

  const handleTopup = () => {
    const val = Number(amount);
    if (isNaN(val) || val < 100) {
      toast.error("Minimum top-up is ৳100");
      return;
    }
    if (val > 50000) {
      toast.error("Maximum top-up is ৳50,000");
      return;
    }

    startTransition(async () => {
      const res = await initiateTopup(val);
      if (res.success && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        toast.error(res.message || "Failed to initiate top-up");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Top up your wallet to book appointments instantly without gateway delays.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant={amount === amt.toString() ? "default" : "outline"}
                className={amount === amt.toString() ? "bg-sage hover:bg-sage/90" : ""}
                onClick={() => setAmount(amt.toString())}
              >
                ৳{amt}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Amount (৳)</label>
            <Input
              type="number"
              min="100"
              max="50000"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>Payment options available on the next step:</p>
            <ul className="list-disc list-inside mt-1">
              <li>bKash</li>
              <li>Nagad</li>
              <li>Credit/Debit Cards</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleTopup} 
            disabled={isPending || !amount || Number(amount) < 100}
            className="bg-sage hover:bg-sage/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
