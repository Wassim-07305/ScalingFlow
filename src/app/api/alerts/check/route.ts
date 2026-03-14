import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALERT_RULES } from "@/lib/alerts/rules";
import { createNotification } from "@/lib/notifications/create";
import { resend } from "@/lib/resend/client";
import { kpiAlertEmail } from "@/lib/resend/templates";

// Cooldown: don't re-fire the same alert within 24h
const COOLDOWN_HOURS = 24;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Fetch recent notifications to avoid duplicate alerts
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() - COOLDOWN_HOURS);

    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("title, created_at")
      .eq("user_id", user.id)
      .eq("type", "system")
      .gte("created_at", cooldownDate.toISOString());

    const recentTitles = new Set((recentNotifs || []).map((n) => n.title));

    // Run all alert rules in parallel
    const results = await Promise.allSettled(
      ALERT_RULES.map((rule) => rule.check(supabase, user.id))
    );

    const alerts = results
      .filter(
        (r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<(typeof ALERT_RULES)[0]["check"]>>>> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value);

    // Create notifications for new alerts (skip duplicates)
    let created = 0;
    for (const alert of alerts) {
      if (recentTitles.has(alert.title)) continue;

      await createNotification({
        userId: user.id,
        type: "system",
        title: alert.title,
        message: alert.message,
        link: alert.link,
      });
      created++;
    }

    // Send email digest for danger/warning alerts (non-blocking)
    if (created > 0 && resend) {
      const newAlerts = alerts.filter((a) => !recentTitles.has(a.title));
      if (newAlerts.some((a) => a.severity === "danger" || a.severity === "warning")) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single();

          const email = profile?.email || user.email;
          const firstName = profile?.full_name?.split(" ")[0] || "Utilisateur";

          if (email) {
            const { subject, html } = kpiAlertEmail(
              firstName,
              newAlerts.map((a) => ({ title: a.title, message: a.message, severity: a.severity }))
            );
            await resend.emails.send({
              from: "ScalingFlow <alerts@scalingflow.com>",
              to: email,
              subject,
              html,
            });
          }
        } catch {
          // Email send failed — non-critical
        }
      }
    }

    return NextResponse.json({
      checked: ALERT_RULES.length,
      triggered: alerts.length,
      created,
      alerts: alerts.map((a) => ({
        ruleId: a.ruleId,
        severity: a.severity,
        title: a.title,
      })),
    });
  } catch (error) {
    console.error("[alerts/check] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des alertes" },
      { status: 500 }
    );
  }
}
