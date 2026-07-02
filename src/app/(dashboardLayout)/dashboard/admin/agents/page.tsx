import { getAllUsers } from "@/services/users/getAllUsers";
import { AgentsClient } from "./AgentsClient";

export default async function AgentsPage() {
  const agentsResponse = await getAllUsers({ role: "AGENT", limit: 100 });

  return <AgentsClient agentsResponse={agentsResponse} />;
}
