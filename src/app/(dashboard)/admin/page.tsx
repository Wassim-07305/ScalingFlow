"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

const MOCK_STATS = {
  totalUsers: 156,
  activeUsers: 89,
  mrr: 12450,
  conversionRate: 8.5,
};

const MOCK_RECENT_USERS = [
  { name: "Sophie M.", email: "sophie@example.com", status: "active", joined: "Il y a 2h" },
  { name: "Thomas D.", email: "thomas@example.com", status: "active", joined: "Il y a 5h" },
  { name: "Julie L.", email: "julie@example.com", status: "trial", joined: "Il y a 1j" },
  { name: "Marc B.", email: "marc@example.com", status: "inactive", joined: "Il y a 3j" },
  { name: "Emma R.", email: "emma@example.com", status: "active", joined: "Il y a 4j" },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin"
        description="Panel d'administration ScalingFlow."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "Utilisateurs", value: MOCK_STATS.totalUsers, icon: Users, color: "text-neon-blue" },
          { label: "Actifs", value: MOCK_STATS.activeUsers, icon: Activity, color: "text-neon-green" },
          { label: "MRR", value: MOCK_STATS.mrr, suffix: "€", icon: DollarSign, color: "text-neon-orange" },
          { label: "Conversion", value: MOCK_STATS.conversionRate, suffix: "%", icon: TrendingUp, color: "text-neon-cyan" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">{kpi.label}</p>
                  <p className="text-2xl font-bold text-text-primary">
                    <AnimatedCounter value={kpi.value} />
                    {kpi.suffix || ""}
                  </p>
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_RECENT_USERS.map((user) => (
              <div key={user.email} className="flex items-center gap-4 p-3 rounded-xl bg-bg-tertiary">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-bg-secondary text-text-secondary text-xs">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{user.name}</p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>
                <Badge variant={
                  user.status === "active" ? "cyan" :
                  user.status === "trial" ? "blue" : "muted"
                }>
                  {user.status === "active" ? "Actif" :
                   user.status === "trial" ? "Essai" : "Inactif"}
                </Badge>
                <span className="text-xs text-text-muted">{user.joined}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
