-- ============================================================
-- Nettoyage des données demo pour les 2 utilisateurs
-- Exécuter AVANT les seeds
-- ============================================================

DO $$
DECLARE
  target_id UUID;
BEGIN
  -- Nettoyer pour gilles
  target_id := '6924010d-7470-4695-8ca3-e0002735ef8e';
  DELETE FROM tasks WHERE user_id = target_id;
  DELETE FROM agent_conversations WHERE user_id = target_id;
  DELETE FROM activity_log WHERE user_id = target_id;
  DELETE FROM notifications WHERE user_id = target_id;
  DELETE FROM ab_tests WHERE user_id = target_id;
  DELETE FROM growth_checkpoints WHERE user_id = target_id;
  DELETE FROM ltv_cac_entries WHERE user_id = target_id;
  DELETE FROM daily_performance_metrics WHERE user_id = target_id;
  DELETE FROM leaderboard_scores WHERE user_id = target_id;
  DELETE FROM community_posts WHERE user_id = target_id;
  DELETE FROM content_pieces WHERE user_id = target_id;
  DELETE FROM ad_daily_metrics WHERE user_id = target_id;
  DELETE FROM ad_campaigns WHERE user_id = target_id;
  DELETE FROM ad_creatives WHERE user_id = target_id;
  DELETE FROM sales_assets WHERE user_id = target_id;
  DELETE FROM brand_identities WHERE user_id = target_id;
  DELETE FROM funnels WHERE user_id = target_id;
  DELETE FROM competitors WHERE user_id = target_id;
  DELETE FROM offers WHERE user_id = target_id;
  DELETE FROM market_analyses WHERE user_id = target_id;

  -- Nettoyer pour wass
  target_id := 'cbe731dd-c0e4-442a-8f1b-a99db5dfc39d';
  DELETE FROM tasks WHERE user_id = target_id;
  DELETE FROM agent_conversations WHERE user_id = target_id;
  DELETE FROM activity_log WHERE user_id = target_id;
  DELETE FROM notifications WHERE user_id = target_id;
  DELETE FROM ab_tests WHERE user_id = target_id;
  DELETE FROM growth_checkpoints WHERE user_id = target_id;
  DELETE FROM ltv_cac_entries WHERE user_id = target_id;
  DELETE FROM daily_performance_metrics WHERE user_id = target_id;
  DELETE FROM leaderboard_scores WHERE user_id = target_id;
  DELETE FROM community_posts WHERE user_id = target_id;
  DELETE FROM content_pieces WHERE user_id = target_id;
  DELETE FROM ad_daily_metrics WHERE user_id = target_id;
  DELETE FROM ad_campaigns WHERE user_id = target_id;
  DELETE FROM ad_creatives WHERE user_id = target_id;
  DELETE FROM sales_assets WHERE user_id = target_id;
  DELETE FROM brand_identities WHERE user_id = target_id;
  DELETE FROM funnels WHERE user_id = target_id;
  DELETE FROM competitors WHERE user_id = target_id;
  DELETE FROM offers WHERE user_id = target_id;
  DELETE FROM market_analyses WHERE user_id = target_id;

  RAISE NOTICE 'Nettoyage terminé pour les 2 users';
END $$;
