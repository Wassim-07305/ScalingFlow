import { createClient } from "@/lib/supabase/server";

export async function logActivity(
  userId: string,
  activityType: string,
  activityData?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: activityType,
    activity_data: activityData || {},
  });
}
