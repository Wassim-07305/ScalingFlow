import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Temporary debug route — remove after fixing brand display
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: brand } = await supabase
      .from("brand_identities")
      .select("id, brand_names, art_direction, brand_kit, logo_concept, selected_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!brand) return NextResponse.json({ error: "Aucune brand identity trouvée" });

    return NextResponse.json({
      id: brand.id,
      selected_name: brand.selected_name,
      brand_names_type: typeof brand.brand_names,
      brand_names_isArray: Array.isArray(brand.brand_names),
      brand_names_raw: brand.brand_names,
      brand_names_first_item: Array.isArray(brand.brand_names) ? brand.brand_names[0] : null,
      brand_names_first_item_keys: Array.isArray(brand.brand_names) && brand.brand_names[0] ? Object.keys(brand.brand_names[0]) : null,
      art_direction_keys: brand.art_direction ? Object.keys(brand.art_direction) : null,
      brand_kit_keys: brand.brand_kit ? Object.keys(brand.brand_kit) : null,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
