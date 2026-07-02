"use client";

import { useState } from "react";
import { Plus, Search, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAgentModal } from "./CreateAgentModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";

const getStatusBadge = (status: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return <Badge className="bg-sage text-white">Active</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">Blocked</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status || "UNKNOWN"}</Badge>;
  }
};

export function AgentsClient({ agentsResponse }: { agentsResponse: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const agentsData = Array.isArray(agentsResponse?.data) ? agentsResponse.data : [];

  const filteredAgents = agentsData.filter(
    (agent: any) =>
      (agent.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.phone || agent.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Agents</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredAgents.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No agents found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent: any) => {
                    const territory = agent.agent?.area 
                        ? `${agent.agent.area}, ${agent.agent.district}` 
                        : (agent.area ? `${agent.area}, ${agent.district}` : "No Territory");
                    
                    return (
                    <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {(agent.name || "A").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {agent.email}
                          </div>
                          {(agent.phone || agent.phoneNumber) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {agent.phone || agent.phoneNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {territory}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : "—"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(agent.status)}</TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <CreateAgentModal open={isModalOpen} setOpen={setIsModalOpen} />
    </div>
  );
}
