"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAgentModal } from "./CreateAgentModal";

export default function AgentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage agents and their assigned territories
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-8 text-center">
            Agent listing will appear here. Backend integration required.
          </div>
        </CardContent>
      </Card>

      <CreateAgentModal open={isModalOpen} setOpen={setIsModalOpen} />
    </div>
  );
}
