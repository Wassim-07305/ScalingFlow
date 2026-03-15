"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";
import { AdImageGenerator } from "@/components/ads/ad-image-generator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, ImagePlus } from "lucide-react";

export default function CreativesPage() {
  return (
    <div>
      <PageHeader
        title="Créatives"
        description="Génère des créatives publicitaires texte et visuelles avec l'IA."
      />

      <Tabs defaultValue="texte" className="mt-2">
        <TabsList>
          <TabsTrigger value="texte" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Texte
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5">
            <ImagePlus className="h-3.5 w-3.5" />
            Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="texte">
          <CreativeGenerator />
        </TabsContent>

        <TabsContent value="images">
          <AdImageGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
