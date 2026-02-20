"use client";

import { cn } from "@/lib/utils/cn";
import { GlowCard } from "@/components/shared/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw, CheckCircle, Shield, Zap, Gift } from "lucide-react";

interface OfferPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offer: any;
  onRegenerate?: () => void;
  className?: string;
}

export function OfferPreview({ offer, onRegenerate, className }: OfferPreviewProps) {
  const raw = offer.ai_raw_response || offer;
  const packaging = raw.packaging || {};
  const delivery = raw.delivery || {};

  const name = offer.offer_name || packaging.offer_name || "Offre sans nom";
  const positioning = offer.positioning || packaging.positioning || "";
  const mechanism = packaging.unique_mechanism || {};
  const pricing = offer.pricing_strategy || packaging.pricing || {};
  const guarantees = offer.guarantees || packaging.guarantees || [];
  const riskReversal = offer.risk_reversal || packaging.risk_reversal || "";
  const noBrainer = offer.no_brainer_element || packaging.no_brainer || "";
  const oto = offer.oto_offer || packaging.oto || null;
  const deliveryData = offer.delivery_structure || delivery;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
            {name}
          </h2>
          {positioning && (
            <p className="mt-2 text-text-secondary max-w-2xl">{positioning}</p>
          )}
        </div>
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Régénérer
          </Button>
        )}
      </div>

      {/* Unique Mechanism */}
      {mechanism.name && (
        <GlowCard glowColor="orange">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-neon-orange" />
            <h3 className="text-lg font-semibold text-text-primary">Mécanisme Unique</h3>
          </div>
          <p className="text-neon-orange font-medium mb-3">{mechanism.name}</p>
          {mechanism.description && (
            <p className="text-text-secondary text-sm mb-4">{mechanism.description}</p>
          )}
          {mechanism.steps?.length > 0 && (
            <div className="space-y-3">
              {mechanism.steps.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neon-orange/15 text-neon-orange text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-text-secondary text-sm pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      )}

      {/* Pricing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Stratégie de Prix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4 mb-6">
            {pricing.anchor_price > 0 && (
              <span className="text-2xl text-text-muted line-through">
                {pricing.anchor_price?.toLocaleString("fr-FR")} &euro;
              </span>
            )}
            {pricing.real_price > 0 && (
              <span className="text-4xl font-bold text-neon-orange">
                {pricing.real_price?.toLocaleString("fr-FR")} &euro;
              </span>
            )}
          </div>
          {pricing.value_breakdown?.length > 0 && (
            <div className="space-y-2">
              {pricing.value_breakdown.map((item: { item: string; value: number }, i: number) => (
                <div key={i} className="flex justify-between py-2 border-b border-border-default/50">
                  <span className="text-text-primary text-sm">{item.item}</span>
                  <span className="text-neon-cyan font-medium text-sm">
                    {item.value?.toLocaleString("fr-FR")} &euro;
                  </span>
                </div>
              ))}
            </div>
          )}
          {pricing.payment_options?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {pricing.payment_options.map((opt: string, i: number) => (
                <Badge key={i} variant="muted">{opt}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guarantees */}
      {guarantees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neon-cyan" />
              Garanties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {guarantees.map((g: { type: string; description: string; duration: string }, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-neon-cyan" />
                    <span className="font-medium text-text-primary text-sm">{g.type}</span>
                  </div>
                  <p className="text-text-secondary text-xs">{g.description}</p>
                  {g.duration && (
                    <Badge variant="cyan" className="mt-2">{g.duration}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Reversal + No Brainer */}
      <div className="grid gap-4 sm:grid-cols-2">
        {riskReversal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inversion du Risque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary text-sm">{riskReversal}</p>
            </CardContent>
          </Card>
        )}
        {noBrainer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-neon-orange" />
                Élément No-Brainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary text-sm">{noBrainer}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* OTO */}
      {oto && (
        <GlowCard glowColor="blue">
          <h3 className="text-lg font-semibold text-text-primary mb-2">OTO (One-Time Offer)</h3>
          {oto.name && <p className="text-neon-blue font-medium">{oto.name}</p>}
          {oto.description && <p className="text-text-secondary text-sm mt-1">{oto.description}</p>}
          {oto.price > 0 && (
            <p className="text-neon-orange font-bold text-xl mt-2">
              {oto.price?.toLocaleString("fr-FR")} &euro;
            </p>
          )}
        </GlowCard>
      )}

      {/* Delivery Structure */}
      {deliveryData?.problematiques?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Structure de Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryData.problematiques.map(
                (p: { name: string; agents_ia: string[]; process: string[]; outils: string[] }, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                    <h4 className="font-medium text-text-primary mb-3">{p.name}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {p.agents_ia?.map((a: string, j: number) => (
                        <Badge key={`ai-${j}`} variant="blue">{a}</Badge>
                      ))}
                      {p.process?.map((pr: string, j: number) => (
                        <Badge key={`pr-${j}`} variant="cyan">{pr}</Badge>
                      ))}
                      {p.outils?.map((o: string, j: number) => (
                        <Badge key={`o-${j}`} variant="muted">{o}</Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
