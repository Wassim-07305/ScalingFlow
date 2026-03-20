"use client";

import React, { useState, useEffect, useCallback, useMemo} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  FlaskConical,
  Trophy,
  Trash2,
  ArrowRight,
  BarChart3,
  Pause,
  Play,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface ABTest {
  id: string;
  name: string;
  variantA: { description: string; conversions: number; traffic: number };
  variantB: { description: string; conversions: number; traffic: number };
  metric: string;
  targetSampleSize: number;
  status: "active" | "paused" | "completed";
  createdAt: string;
  winner: "A" | "B" | null;
}


// ─── Supabase helpers ────────────────────────────────────────
function mapRowToTest(row: Record<string, unknown>): ABTest {
  return {
    id: row.id as string,
    name: row.name as string,
    variantA: {
      description: (row.variant_a_description as string) || "",
      conversions: (row.variant_a_conversions as number) || 0,
      traffic: (row.variant_a_traffic as number) || 0,
    },
    variantB: {
      description: (row.variant_b_description as string) || "",
      conversions: (row.variant_b_conversions as number) || 0,
      traffic: (row.variant_b_traffic as number) || 0,
    },
    metric: (row.metric as string) || "Taux de conversion",
    targetSampleSize: (row.target_sample_size as number) || 500,
    status: (row.status as "active" | "paused" | "completed") || "active",
    createdAt: (row.created_at as string) || new Date().toISOString(),
    winner: (row.winner as "A" | "B" | null) || null,
  };
}

// ─── Stats helpers ───────────────────────────────────────────
function calcConversionRate(conversions: number, traffic: number): number {
  return traffic > 0 ? (conversions / traffic) * 100 : 0;
}

function calcConfidence(
  convA: number,
  trafficA: number,
  convB: number,
  trafficB: number,
): number {
  // Simplified Z-test approximation
  const pA = trafficA > 0 ? convA / trafficA : 0;
  const pB = trafficB > 0 ? convB / trafficB : 0;
  const p = (convA + convB) / (trafficA + trafficB || 1);
  const se = Math.sqrt(
    p * (1 - p) * (1 / (trafficA || 1) + 1 / (trafficB || 1)),
  );
  if (se === 0) return 0;
  const z = Math.abs(pA - pB) / se;
  // Approximate p-value from z-score (one-sided)
  const confidence = Math.min(
    99.9,
    (1 - Math.exp(-0.717 * z - 0.416 * z * z)) * 100,
  );
  return Math.max(0, confidence);
}

function getProgressPct(test: ABTest): number {
  const total = test.variantA.traffic + test.variantB.traffic;
  return Math.min(100, (total / (test.targetSampleSize * 2)) * 100);
}

// ─── Main component ──────────────────────────────────────────
export function ABTestManager() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({
    name: "",
    variantADesc: "",
    variantBDesc: "",
    metric: "Taux de conversion",
    targetSampleSize: 500,
  });
  const [updateData, setUpdateData] = useState({
    variantAConversions: 0,
    variantATraffic: 0,
    variantBConversions: 0,
    variantBTraffic: 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setTests(data.map(mapRowToTest));
      }
      setIsDemo(false);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveToSupabase = useCallback(
    async (test: ABTest) => {
      await supabase.from("ab_tests").upsert({
        id: test.id,
        user_id: user!.id,
        name: test.name,
        metric: test.metric,
        target_sample_size: test.targetSampleSize,
        status: test.status,
        winner: test.winner,
        variant_a_description: test.variantA.description,
        variant_a_conversions: test.variantA.conversions,
        variant_a_traffic: test.variantA.traffic,
        variant_b_description: test.variantB.description,
        variant_b_conversions: test.variantB.conversions,
        variant_b_traffic: test.variantB.traffic,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [user],
  );

  const handleCreate = useCallback(async () => {
    if (!user || !newTest.name.trim()) return;

    const test: ABTest = {
      id: crypto.randomUUID(),
      name: newTest.name.trim(),
      variantA: {
        description: newTest.variantADesc.trim(),
        conversions: 0,
        traffic: 0,
      },
      variantB: {
        description: newTest.variantBDesc.trim(),
        conversions: 0,
        traffic: 0,
      },
      metric: newTest.metric,
      targetSampleSize: newTest.targetSampleSize,
      status: "active",
      createdAt: format(new Date(), "yyyy-MM-dd"),
      winner: null,
    };

    const updated = isDemo ? [test] : [...tests, test];
    setTests(updated);
    setIsDemo(false);
    await saveToSupabase(test);
    setShowCreateForm(false);
    setNewTest({
      name: "",
      variantADesc: "",
      variantBDesc: "",
      metric: "Taux de conversion",
      targetSampleSize: 500,
    });
    toast.success("Test A/B créé !");
  }, [user, newTest, tests, isDemo, saveToSupabase]);

  const handleUpdateStats = useCallback(
    async (testId: string) => {
      if (!user) return;
      let updatedTest: ABTest | null = null;
      const updated = tests.map((t) => {
        if (t.id !== testId) return t;
        const newA = {
          ...t.variantA,
          conversions: t.variantA.conversions + updateData.variantAConversions,
          traffic: t.variantA.traffic + updateData.variantATraffic,
        };
        const newB = {
          ...t.variantB,
          conversions: t.variantB.conversions + updateData.variantBConversions,
          traffic: t.variantB.traffic + updateData.variantBTraffic,
        };

        // Auto-declare winner when both variants reach 100+ visits and confidence >= 90%
        if (
          t.status === "active" &&
          newA.traffic >= 100 &&
          newB.traffic >= 100
        ) {
          const conf = calcConfidence(
            newA.conversions,
            newA.traffic,
            newB.conversions,
            newB.traffic,
          );
          if (conf >= 90) {
            const rateA = calcConversionRate(newA.conversions, newA.traffic);
            const rateB = calcConversionRate(newB.conversions, newB.traffic);
            const winner =
              rateA > rateB
                ? ("A" as const)
                : rateB > rateA
                  ? ("B" as const)
                  : null;
            if (winner) {
              toast.success(
                `Terminé automatiquement : Variante ${winner} gagnante (${newA.traffic + newB.traffic} visites, confiance ${conf.toFixed(0)}%)`,
              );
              updatedTest = {
                ...t,
                variantA: newA,
                variantB: newB,
                status: "completed" as const,
                winner,
              };
              return updatedTest;
            }
          }
        }

        updatedTest = { ...t, variantA: newA, variantB: newB };
        return updatedTest;
      });
      setTests(updated);
      if (updatedTest && !isDemo) await saveToSupabase(updatedTest);
      setShowUpdateForm(null);
      setUpdateData({
        variantAConversions: 0,
        variantATraffic: 0,
        variantBConversions: 0,
        variantBTraffic: 0,
      });
      toast.success("Statistiques mises à jour");
    },
    [user, tests, updateData, isDemo, saveToSupabase],
  );

  const handleToggleStatus = useCallback(
    async (testId: string) => {
      if (!user) return;
      const updated = tests.map((t) => {
        if (t.id !== testId) return t;
        return {
          ...t,
          status:
            t.status === "active" ? ("paused" as const) : ("active" as const),
        };
      });
      setTests(updated);
      const toggled = updated.find((t) => t.id === testId);
      if (!isDemo && toggled) await saveToSupabase(toggled);
    },
    [user, tests, isDemo, saveToSupabase],
  );

  const handleComplete = useCallback(
    async (testId: string) => {
      if (!user) return;
      const updated = tests.map((t) => {
        if (t.id !== testId) return t;
        const rateA = calcConversionRate(
          t.variantA.conversions,
          t.variantA.traffic,
        );
        const rateB = calcConversionRate(
          t.variantB.conversions,
          t.variantB.traffic,
        );
        const winner =
          rateA > rateB
            ? ("A" as const)
            : rateB > rateA
              ? ("B" as const)
              : null;
        return { ...t, status: "completed" as const, winner };
      });
      setTests(updated);
      const completed = updated.find((t) => t.id === testId);
      if (!isDemo && completed) await saveToSupabase(completed);
      toast.success("Test terminé !");
    },
    [user, tests, isDemo, saveToSupabase],
  );

  const handleDelete = useCallback(
    async (testId: string) => {
      if (!user) return;
      const updated = tests.filter((t) => t.id !== testId);
      setTests(updated);
      if (!isDemo) {
        await supabase.from("ab_tests").delete().eq("id", testId);
      }
      toast.success("Test supprimé");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, tests, isDemo],
  );

  const activeTests = tests.filter((t) => t.status !== "completed");
  const completedTests = tests.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          )}
          {isDemo && !loading && (
            <Badge variant="yellow">Données de démonstration</Badge>
          )}
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau test A/B
        </Button>
      </div>

      {/* Active Tests */}
      {activeTests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-text-primary">
            Tests actifs ({activeTests.length})
          </h3>
          {activeTests.map((test) => {
            const rateA = calcConversionRate(
              test.variantA.conversions,
              test.variantA.traffic,
            );
            const rateB = calcConversionRate(
              test.variantB.conversions,
              test.variantB.traffic,
            );
            const confidence = calcConfidence(
              test.variantA.conversions,
              test.variantA.traffic,
              test.variantB.conversions,
              test.variantB.traffic,
            );
            const progress = getProgressPct(test);

            return (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-accent" />
                      <CardTitle className="text-sm">{test.name}</CardTitle>
                      <Badge
                        variant={
                          test.status === "active" ? "default" : "yellow"
                        }
                      >
                        {test.status === "active" ? "Actif" : "En pause"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(test.id)}
                        title={
                          test.status === "active"
                            ? "Mettre en pause"
                            : "Reprendre"
                        }
                      >
                        {test.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComplete(test.id)}
                        title="Terminer le test"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(test.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Variants comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Variant A */}
                    <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-default">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-info/20 text-info text-xs font-bold flex items-center justify-center ring-1 ring-info/30">
                          A
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          Variante A
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-3">
                        {test.variantA.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xl font-bold text-text-primary">
                            {rateA.toFixed(1)}%
                          </span>
                          <span className="text-xs text-text-muted ml-1">
                            conv.
                          </span>
                        </div>
                        <div className="text-xs text-text-muted">
                          {test.variantA.conversions}/{test.variantA.traffic}{" "}
                          visiteurs
                        </div>
                      </div>
                      {/* Visual bar */}
                      <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-info/80 to-info rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(rateA * 5, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-default">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-accent/20 text-accent text-xs font-bold flex items-center justify-center ring-1 ring-accent/30">
                          B
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          Variante B
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-3">
                        {test.variantB.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xl font-bold text-text-primary">
                            {rateB.toFixed(1)}%
                          </span>
                          <span className="text-xs text-text-muted ml-1">
                            conv.
                          </span>
                        </div>
                        <div className="text-xs text-text-muted">
                          {test.variantB.conversions}/{test.variantB.traffic}{" "}
                          visiteurs
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(rateB * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence & Progress */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Confiance :</span>
                        <Badge
                          variant={
                            confidence >= 95
                              ? "default"
                              : confidence >= 80
                                ? "yellow"
                                : "muted"
                          }
                        >
                          {confidence.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Métrique :</span>
                        <span className="text-text-secondary">
                          {test.metric}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowUpdateForm(test.id);
                        setUpdateData({
                          variantAConversions: 0,
                          variantATraffic: 0,
                          variantBConversions: 0,
                          variantBTraffic: 0,
                        });
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Mettre à jour
                    </Button>
                  </div>

                  {/* Auto-complete info */}
                  {test.variantA.traffic >= 100 &&
                    test.variantB.traffic >= 100 &&
                    confidence >= 90 && (
                      <div className="mt-2 p-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent">
                        Ce test sera automatiquement complété à la prochaine
                        mise à jour (100+ visites par variante atteint,
                        confiance {">"}90%)
                      </div>
                    )}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>
                        Progression{" "}
                        {test.variantA.traffic + test.variantB.traffic >= 200
                          ? "(seuil 100+/variante atteint)"
                          : `(seuil: 100 visites/variante)`}
                      </span>
                      <span
                        className={cn(
                          progress >= 100 ? "text-accent font-semibold" : "",
                        )}
                      >
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent/40 to-accent rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-text-primary">
            Tests terminés ({completedTests.length})
          </h3>
          {completedTests.map((test) => {
            const rateA = calcConversionRate(
              test.variantA.conversions,
              test.variantA.traffic,
            );
            const rateB = calcConversionRate(
              test.variantB.conversions,
              test.variantB.traffic,
            );

            return (
              <Card key={test.id} className="opacity-80">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-warning" />
                      <div>
                        <span className="text-sm font-medium text-text-primary">
                          {test.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted">
                            Variante A : {rateA.toFixed(1)}%
                          </span>
                          <ArrowRight className="h-3 w-3 text-text-muted" />
                          <span className="text-xs text-text-muted">
                            Variante B : {rateB.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.winner && (
                        <Badge variant="default">
                          Gagnant : Variante {test.winner}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {tests.length === 0 && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/12 flex items-center justify-center mb-4">
              <FlaskConical className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Aucun test A/B en cours
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-4">
              Crée ton premier test A/B pour comparer deux variantes et
              optimiser tes conversions.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Créer un test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Test Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau test A/B</DialogTitle>
            <DialogDescription>
              Définis les deux variantes à comparer et la métrique à suivre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="test-name">Nom du test</Label>
              <Input
                id="test-name"
                placeholder="Ex: Hook video vs Hook texte"
                value={newTest.name}
                onChange={(e) =>
                  setNewTest((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="variant-a">Variante A</Label>
              <Input
                id="variant-a"
                placeholder="Description de la variante A"
                value={newTest.variantADesc}
                onChange={(e) =>
                  setNewTest((p) => ({ ...p, variantADesc: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="variant-b">Variante B</Label>
              <Input
                id="variant-b"
                placeholder="Description de la variante B"
                value={newTest.variantBDesc}
                onChange={(e) =>
                  setNewTest((p) => ({ ...p, variantBDesc: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Métrique à suivre</Label>
              <Select
                value={newTest.metric}
                onValueChange={(v) => setNewTest((p) => ({ ...p, metric: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Taux de conversion">
                    Taux de conversion
                  </SelectItem>
                  <SelectItem value="CTR">CTR</SelectItem>
                  <SelectItem value="Taux de clic CTA">
                    Taux de clic CTA
                  </SelectItem>
                  <SelectItem value="CPL">CPL</SelectItem>
                  <SelectItem value="ROAS">ROAS</SelectItem>
                  <SelectItem value="Taux d'ouverture">
                    Taux d&apos;ouverture
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sample-size">
                Taille d&apos;échantillon cible (par variante)
              </Label>
              <Input
                id="sample-size"
                type="number"
                min={50}
                value={newTest.targetSampleSize}
                onChange={(e) =>
                  setNewTest((p) => ({
                    ...p,
                    targetSampleSize: parseInt(e.target.value) || 500,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!newTest.name.trim()}>
              Créer le test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Stats Dialog */}
      <Dialog
        open={!!showUpdateForm}
        onOpenChange={() => setShowUpdateForm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mettre à jour les statistiques</DialogTitle>
            <DialogDescription>
              Ajoute les nouvelles données depuis ta dernière mise à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-xl bg-info/8 border border-info/20">
              <h4 className="text-sm font-medium text-info mb-2">Variante A</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nouveaux visiteurs</Label>
                  <Input
                    type="number"
                    min={0}
                    value={updateData.variantATraffic || ""}
                    onChange={(e) =>
                      setUpdateData((p) => ({
                        ...p,
                        variantATraffic: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Nouvelles conversions</Label>
                  <Input
                    type="number"
                    min={0}
                    value={updateData.variantAConversions || ""}
                    onChange={(e) =>
                      setUpdateData((p) => ({
                        ...p,
                        variantAConversions: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-accent/8 border border-accent/20">
              <h4 className="text-sm font-medium text-accent mb-2">
                Variante B
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nouveaux visiteurs</Label>
                  <Input
                    type="number"
                    min={0}
                    value={updateData.variantBTraffic || ""}
                    onChange={(e) =>
                      setUpdateData((p) => ({
                        ...p,
                        variantBTraffic: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Nouvelles conversions</Label>
                  <Input
                    type="number"
                    min={0}
                    value={updateData.variantBConversions || ""}
                    onChange={(e) =>
                      setUpdateData((p) => ({
                        ...p,
                        variantBConversions: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpdateForm(null)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                showUpdateForm && handleUpdateStats(showUpdateForm)
              }
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
