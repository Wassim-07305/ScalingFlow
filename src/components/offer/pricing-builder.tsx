"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface PricingBuilderProps {
  anchorPrice: number;
  realPrice: number;
  valueBreakdown: { item: string; value: number }[];
  onChange: (data: {
    anchorPrice: number;
    realPrice: number;
    valueBreakdown: { item: string; value: number }[];
  }) => void;
  className?: string;
}

export function PricingBuilder({
  anchorPrice,
  realPrice,
  valueBreakdown,
  onChange,
  className,
}: PricingBuilderProps) {
  const updateBreakdown = (
    index: number,
    field: "item" | "value",
    val: string,
  ) => {
    const updated = [...valueBreakdown];
    if (field === "value") {
      updated[index] = { ...updated[index], value: parseInt(val) || 0 };
    } else {
      updated[index] = { ...updated[index], item: val };
    }
    onChange({ anchorPrice, realPrice, valueBreakdown: updated });
  };

  const addItem = () => {
    onChange({
      anchorPrice,
      realPrice,
      valueBreakdown: [...valueBreakdown, { item: "", value: 0 }],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      anchorPrice,
      realPrice,
      valueBreakdown: valueBreakdown.filter((_, i) => i !== index),
    });
  };

  const totalValue = valueBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Stratégie de prix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Prix ancre (barre)</Label>
            <Input
              type="number"
              value={anchorPrice}
              onChange={(e) =>
                onChange({
                  anchorPrice: parseInt(e.target.value) || 0,
                  realPrice,
                  valueBreakdown,
                })
              }
              placeholder="5000"
            />
          </div>
          <div>
            <Label>Prix reel</Label>
            <Input
              type="number"
              value={realPrice}
              onChange={(e) =>
                onChange({
                  anchorPrice,
                  realPrice: parseInt(e.target.value) || 0,
                  valueBreakdown,
                })
              }
              placeholder="2997"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Decomposition de valeur</Label>
            <Button variant="ghost" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {valueBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={item.item}
                  onChange={(e) =>
                    updateBreakdown(index, "item", e.target.value)
                  }
                  placeholder="Element..."
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.value}
                  onChange={(e) =>
                    updateBreakdown(index, "value", e.target.value)
                  }
                  placeholder="0"
                  className="w-28"
                />
                <span className="text-text-muted text-sm">&euro;</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-text-muted" />
                </Button>
              </div>
            ))}
          </div>
          {valueBreakdown.length > 0 && (
            <div className="flex justify-between mt-3 pt-3 border-t border-border-default">
              <span className="text-sm font-medium text-text-secondary">
                Valeur totale
              </span>
              <span className="text-sm font-bold text-accent">
                {totalValue.toLocaleString("fr-FR")} &euro;
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
