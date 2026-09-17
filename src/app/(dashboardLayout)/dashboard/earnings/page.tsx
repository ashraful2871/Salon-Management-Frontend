"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { Loader2, DollarSign, Download, ArrowUpRight } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

// Placeholder types for Earnings
type Payout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  status: string;
};

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState({
    pendingNetMinor: 0,
    totalPaidMinor: 0,
  });

  useEffect(() => {
    // In a real app, you would fetch from /payouts/me or similar
    const load = async () => {
      setLoading(true);
      try {
        // const res = await serverFetch.get("/payouts/me");
        // if (res.ok) { const data = await res.json(); setPayouts(data.data); }
        // For now, simulating API response
        setTimeout(() => {
          setStats({ pendingNetMinor: 150000, totalPaidMinor: 4500000 });
          setPayouts([
            { id: "1", periodStart: "2023-10-01T00:00:00Z", periodEnd: "2023-10-07T00:00:00Z", grossMinor: 200000, commissionMinor: 16000, netMinor: 184000, status: "PAID" },
            { id: "2", periodStart: "2023-10-08T00:00:00Z", periodEnd: "2023-10-14T00:00:00Z", grossMinor: 150000, commissionMinor: 12000, netMinor: 138000, status: "PENDING" },
          ]);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" /> Earnings & Payouts
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your revenue, commissions, and bank payouts
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-md bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800">
                  Pending Payout (Next Batch)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-900">
                  {formatBDT(stats.pendingNetMinor)}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid (All Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatBDT(stats.totalPaidMinor)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No payouts found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground">Gross</p>
                          <p className="font-medium">{formatBDT(p.grossMinor)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Commission</p>
                          <p className="font-medium text-red-500">-{formatBDT(p.commissionMinor)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Net Payout</p>
                          <p className="font-bold text-lg text-green-600">{formatBDT(p.netMinor)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
