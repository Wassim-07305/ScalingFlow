export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          country: string | null;
          language: string | null;
          avatar_url: string | null;
          role: "student" | "admin" | "coach";
          onboarding_completed: boolean;
          onboarding_step: number;
          situation: "zero" | "salarie" | "freelance" | "entrepreneur" | "etudiant" | "reconversion" | "sans_emploi" | null;
          situation_details: Json | null;
          skills: string[] | null;
          vault_skills: Json | null;
          expertise_answers: Json | null;
          parcours: "A1" | "A2" | "A3" | "B" | "C" | null;
          formations: string[] | null;
          experience_level: "beginner" | "intermediate" | "advanced" | null;
          current_revenue: number | null;
          target_revenue: number | null;
          industries: string[] | null;
          objectives: string[] | null;
          budget_monthly: number | null;
          hours_per_week: number | null;
          deadline: string | null;
          team_size: number | null;
          vault_completed: boolean;
          vault_analysis: Json | null;
          selected_market: string | null;
          market_viability_score: number | null;
          niche: string | null;
          xp_points: number;
          level: number;
          streak_days: number;
          last_active_date: string | null;
          badges: string[] | null;
          global_progress: number;
          show_on_leaderboard: boolean;
          show_revenue: boolean;
          stripe_customer_id: string | null;
          subscription_status: string;
          subscription_plan: string;
          meta_access_token: string | null;
          meta_ad_account_id: string | null;
          ghl_webhook_url: string | null;
          webhook_api_key: string | null;
          organization_id: string | null;
          stripe_connect_account_id: string | null;
          vault_extraction: Json | null;
          claude_api_key: string | null;
          vault_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          country?: string | null;
          language?: string | null;
          avatar_url?: string | null;
          role?: "student" | "admin" | "coach";
          onboarding_completed?: boolean;
          onboarding_step?: number;
          situation?: "zero" | "salarie" | "freelance" | "entrepreneur" | "etudiant" | "reconversion" | "sans_emploi" | null;
          situation_details?: Json | null;
          skills?: string[] | null;
          vault_skills?: Json | null;
          expertise_answers?: Json | null;
          parcours?: "A1" | "A2" | "A3" | "B" | "C" | null;
          formations?: string[] | null;
          experience_level?: "beginner" | "intermediate" | "advanced" | null;
          current_revenue?: number | null;
          target_revenue?: number | null;
          industries?: string[] | null;
          objectives?: string[] | null;
          budget_monthly?: number | null;
          hours_per_week?: number | null;
          deadline?: string | null;
          team_size?: number | null;
          vault_completed?: boolean;
          vault_analysis?: Json | null;
          selected_market?: string | null;
          market_viability_score?: number | null;
          niche?: string | null;
          xp_points?: number;
          level?: number;
          streak_days?: number;
          last_active_date?: string | null;
          badges?: string[] | null;
          global_progress?: number;
          show_on_leaderboard?: boolean;
          show_revenue?: boolean;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_plan?: string;
          meta_access_token?: string | null;
          meta_ad_account_id?: string | null;
          ghl_webhook_url?: string | null;
          webhook_api_key?: string | null;
          organization_id?: string | null;
          stripe_connect_account_id?: string | null;
          vault_extraction?: Json | null;
          claude_api_key?: string | null;
          vault_updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          country?: string | null;
          language?: string | null;
          avatar_url?: string | null;
          role?: "student" | "admin" | "coach";
          onboarding_completed?: boolean;
          onboarding_step?: number;
          situation?: "zero" | "salarie" | "freelance" | "entrepreneur" | "etudiant" | "reconversion" | "sans_emploi" | null;
          situation_details?: Json | null;
          skills?: string[] | null;
          vault_skills?: Json | null;
          expertise_answers?: Json | null;
          parcours?: "A1" | "A2" | "A3" | "B" | "C" | null;
          formations?: string[] | null;
          experience_level?: "beginner" | "intermediate" | "advanced" | null;
          current_revenue?: number | null;
          target_revenue?: number | null;
          industries?: string[] | null;
          objectives?: string[] | null;
          budget_monthly?: number | null;
          hours_per_week?: number | null;
          deadline?: string | null;
          team_size?: number | null;
          vault_completed?: boolean;
          vault_analysis?: Json | null;
          selected_market?: string | null;
          market_viability_score?: number | null;
          niche?: string | null;
          xp_points?: number;
          level?: number;
          streak_days?: number;
          last_active_date?: string | null;
          badges?: string[] | null;
          global_progress?: number;
          show_on_leaderboard?: boolean;
          show_revenue?: boolean;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_plan?: string;
          meta_access_token?: string | null;
          meta_ad_account_id?: string | null;
          organization_id?: string | null;
          ghl_webhook_url?: string | null;
          webhook_api_key?: string | null;
          stripe_connect_account_id?: string | null;
          vault_extraction?: Json | null;
          claude_api_key?: string | null;
          vault_updated_at?: string | null;
        };
      };
      market_analyses: {
        Row: {
          id: string;
          user_id: string;
          market_name: string;
          market_description: string | null;
          problems: string[] | null;
          opportunities: string[] | null;
          competitors: Json | null;
          demand_signals: Json | null;
          viability_score: number | null;
          recommended_positioning: string | null;
          target_avatar: Json | null;
          persona: Json | null;
          schwartz_level: number | null;
          schwartz_analysis: Json | null;
          country: string | null;
          language: string | null;
          ai_raw_response: Json | null;
          bleeding_neck_pains: Json | null;
          competitor_analysis: Json | null;
          selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market_name: string;
          market_description?: string | null;
          problems?: string[] | null;
          opportunities?: string[] | null;
          competitors?: Json | null;
          demand_signals?: Json | null;
          viability_score?: number | null;
          recommended_positioning?: string | null;
          target_avatar?: Json | null;
          persona?: Json | null;
          schwartz_level?: number | null;
          schwartz_analysis?: Json | null;
          country?: string | null;
          language?: string | null;
          ai_raw_response?: Json | null;
          bleeding_neck_pains?: Json | null;
          competitor_analysis?: Json | null;
          selected?: boolean;
        };
        Update: {
          market_name?: string;
          market_description?: string | null;
          problems?: string[] | null;
          opportunities?: string[] | null;
          competitors?: Json | null;
          demand_signals?: Json | null;
          viability_score?: number | null;
          recommended_positioning?: string | null;
          target_avatar?: Json | null;
          persona?: Json | null;
          schwartz_level?: number | null;
          schwartz_analysis?: Json | null;
          country?: string | null;
          language?: string | null;
          bleeding_neck_pains?: Json | null;
          competitor_analysis?: Json | null;
          ai_raw_response?: Json | null;
          selected?: boolean;
        };
      };
      offers: {
        Row: {
          id: string;
          user_id: string;
          market_analysis_id: string | null;
          offer_name: string;
          positioning: string | null;
          unique_mechanism: string | null;
          pricing_strategy: Json | null;
          guarantees: Json | null;
          no_brainer_element: string | null;
          risk_reversal: string | null;
          delivery_structure: Json | null;
          oto_offer: Json | null;
          oto_data: Json | null;
          delivery_data: Json | null;
          unique_mechanism_details: Json | null;
          full_document: string | null;
          status: "draft" | "validated" | "active";
          ai_raw_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market_analysis_id?: string | null;
          offer_name: string;
          positioning?: string | null;
          unique_mechanism?: string | null;
          pricing_strategy?: Json | null;
          guarantees?: Json | null;
          no_brainer_element?: string | null;
          risk_reversal?: string | null;
          delivery_structure?: Json | null;
          oto_offer?: Json | null;
          oto_data?: Json | null;
          delivery_data?: Json | null;
          unique_mechanism_details?: Json | null;
          full_document?: string | null;
          status?: "draft" | "validated" | "active";
          ai_raw_response?: Json | null;
        };
        Update: {
          offer_name?: string;
          positioning?: string | null;
          unique_mechanism?: string | null;
          pricing_strategy?: Json | null;
          guarantees?: Json | null;
          no_brainer_element?: string | null;
          risk_reversal?: string | null;
          delivery_structure?: Json | null;
          oto_offer?: Json | null;
          oto_data?: Json | null;
          delivery_data?: Json | null;
          unique_mechanism_details?: Json | null;
          full_document?: string | null;
          status?: "draft" | "validated" | "active";
          ai_raw_response?: Json | null;
        };
      };
      funnels: {
        Row: {
          id: string;
          user_id: string;
          offer_id: string | null;
          funnel_name: string;
          custom_domain: string | null;
          optin_page: Json | null;
          vsl_page: Json | null;
          thankyou_page: Json | null;
          ab_variants: Json | null;
          status: "draft" | "published" | "paused";
          published: boolean;
          published_slug: string | null;
          published_at: string | null;
          total_visits: number;
          total_optins: number;
          conversion_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          offer_id?: string | null;
          funnel_name: string;
          custom_domain?: string | null;
          optin_page?: Json | null;
          vsl_page?: Json | null;
          thankyou_page?: Json | null;
          ab_variants?: Json | null;
          status?: "draft" | "published" | "paused";
          published?: boolean;
          published_slug?: string | null;
        };
        Update: {
          funnel_name?: string;
          custom_domain?: string | null;
          optin_page?: Json | null;
          vsl_page?: Json | null;
          thankyou_page?: Json | null;
          ab_variants?: Json | null;
          status?: "draft" | "published" | "paused";
          published?: boolean;
          published_slug?: string | null;
          published_at?: string | null;
          total_visits?: number;
          total_optins?: number;
          conversion_rate?: number;
        };
      };
      sales_assets: {
        Row: {
          id: string;
          user_id: string;
          offer_id: string | null;
          asset_type: string;
          title: string;
          content: string;
          metadata: Json | null;
          status: "draft" | "validated" | "active";
          ai_raw_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          offer_id?: string | null;
          asset_type: string;
          title: string;
          content: string;
          metadata?: Json | null;
          status?: "draft" | "validated" | "active";
          ai_raw_response?: Json | null;
        };
        Update: {
          asset_type?: string;
          title?: string;
          content?: string;
          metadata?: Json | null;
          status?: "draft" | "validated" | "active";
          ai_raw_response?: Json | null;
        };
      };
      ad_creatives: {
        Row: {
          id: string;
          user_id: string;
          creative_type: "image" | "video_script" | "carousel" | "dm_script";
          ad_copy: string;
          headline: string | null;
          hook: string | null;
          cta: string | null;
          image_url: string | null;
          video_script: string | null;
          target_audience: string | null;
          angle: string | null;
          impressions: number;
          clicks: number;
          ctr: number;
          spend: number;
          conversions: number;
          cpa: number;
          status: "draft" | "ready" | "active" | "paused" | "stopped";
          meta_ad_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          creative_type: "image" | "video_script" | "carousel" | "dm_script";
          ad_copy: string;
          headline?: string | null;
          hook?: string | null;
          cta?: string | null;
          image_url?: string | null;
          video_script?: string | null;
          target_audience?: string | null;
          angle?: string | null;
          status?: "draft" | "ready" | "active" | "paused" | "stopped";
        };
        Update: {
          creative_type?: "image" | "video_script" | "carousel" | "dm_script";
          ad_copy?: string;
          headline?: string | null;
          hook?: string | null;
          cta?: string | null;
          image_url?: string | null;
          video_script?: string | null;
          target_audience?: string | null;
          angle?: string | null;
          impressions?: number;
          clicks?: number;
          ctr?: number;
          spend?: number;
          conversions?: number;
          cpa?: number;
          status?: "draft" | "ready" | "active" | "paused" | "stopped";
          meta_ad_id?: string | null;
        };
      };
      ad_campaigns: {
        Row: {
          id: string;
          user_id: string;
          campaign_name: string;
          campaign_type: string | null;
          daily_budget: number | null;
          total_budget: number | null;
          meta_campaign_id: string | null;
          meta_adset_id: string | null;
          audience_config: Json | null;
          total_spend: number;
          total_impressions: number;
          total_clicks: number;
          total_conversions: number;
          roas: number;
          status: "draft" | "active" | "paused" | "completed";
          ai_recommendations: Json | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_name: string;
          campaign_type?: string | null;
          daily_budget?: number | null;
          total_budget?: number | null;
          audience_config?: Json | null;
          status?: "draft" | "active" | "paused" | "completed";
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          campaign_name?: string;
          campaign_type?: string | null;
          daily_budget?: number | null;
          total_budget?: number | null;
          audience_config?: Json | null;
          total_spend?: number;
          total_impressions?: number;
          total_clicks?: number;
          total_conversions?: number;
          roas?: number;
          status?: "draft" | "active" | "paused" | "completed";
          ai_recommendations?: Json | null;
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      content_pieces: {
        Row: {
          id: string;
          user_id: string;
          content_type: string;
          title: string;
          content: string;
          hook: string | null;
          hashtags: string[] | null;
          media_urls: string[] | null;
          scheduled_date: string | null;
          published: boolean;
          published_url: string | null;
          ai_raw_response: Json | null;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: string;
          title: string;
          content: string;
          hook?: string | null;
          hashtags?: string[] | null;
          media_urls?: string[] | null;
          scheduled_date?: string | null;
          published?: boolean;
          ai_raw_response?: Json | null;
        };
        Update: {
          content_type?: string;
          title?: string;
          content?: string;
          hook?: string | null;
          hashtags?: string[] | null;
          media_urls?: string[] | null;
          scheduled_date?: string | null;
          published?: boolean;
          published_url?: string | null;
          ai_raw_response?: Json | null;
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
        };
      };
      academy_modules: {
        Row: {
          id: string;
          module_name: string;
          module_slug: string;
          module_description: string | null;
          module_order: number;
          icon: string | null;
          color: string | null;
          total_videos: number;
          total_duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_name: string;
          module_slug: string;
          module_description?: string | null;
          module_order: number;
          icon?: string | null;
          color?: string | null;
        };
        Update: {
          module_name?: string;
          module_slug?: string;
          module_description?: string | null;
          module_order?: number;
          icon?: string | null;
          color?: string | null;
          total_videos?: number;
          total_duration_minutes?: number;
        };
      };
      academy_videos: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          video_url: string;
          duration_minutes: number | null;
          video_order: number;
          resources: Json | null;
          related_saas_module: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string | null;
          video_url: string;
          duration_minutes?: number | null;
          video_order: number;
          resources?: Json | null;
          related_saas_module?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          video_url?: string;
          duration_minutes?: number | null;
          video_order?: number;
          resources?: Json | null;
          related_saas_module?: string | null;
        };
      };
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          watched: boolean;
          watched_at: string | null;
          watch_percentage: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          watched?: boolean;
          watched_at?: string | null;
          watch_percentage?: number;
        };
        Update: {
          watched?: boolean;
          watched_at?: string | null;
          watch_percentage?: number;
        };
      };
      milestones: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          milestone_order: number;
          badge_name: string | null;
          icon: string | null;
          avg_days_to_reach: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          milestone_order: number;
          badge_name?: string | null;
          icon?: string | null;
          avg_days_to_reach?: number | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          milestone_order?: number;
          badge_name?: string | null;
          icon?: string | null;
          avg_days_to_reach?: number | null;
        };
      };
      user_milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          task_type: "action" | "video" | "review" | "launch" | null;
          related_module: string | null;
          related_video_id: string | null;
          related_milestone_id: string | null;
          estimated_minutes: number | null;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          task_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          task_type?: "action" | "video" | "review" | "launch" | null;
          related_module?: string | null;
          related_video_id?: string | null;
          related_milestone_id?: string | null;
          estimated_minutes?: number | null;
          due_date?: string | null;
          completed?: boolean;
          task_order?: number | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          task_type?: "action" | "video" | "review" | "launch" | null;
          related_module?: string | null;
          estimated_minutes?: number | null;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          task_order?: number | null;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          category: "general" | "wins" | "questions" | "feedback" | "offers" | "ads";
          title: string | null;
          content: string;
          media_urls: string[] | null;
          pinned: boolean;
          auto_generated: boolean;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: "general" | "wins" | "questions" | "feedback" | "offers" | "ads";
          title?: string | null;
          content: string;
          media_urls?: string[] | null;
          pinned?: boolean;
          auto_generated?: boolean;
        };
        Update: {
          category?: "general" | "wins" | "questions" | "feedback" | "offers" | "ads";
          title?: string | null;
          content?: string;
          media_urls?: string[] | null;
          pinned?: boolean;
          likes_count?: number;
          comments_count?: number;
        };
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      community_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: never;
      };
      leaderboard_scores: {
        Row: {
          id: string;
          user_id: string;
          progress_score: number;
          business_score: number;
          engagement_score: number;
          composite_score: number;
          rank_position: number | null;
          monthly_revenue: number;
          total_clients: number;
          total_leads: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          progress_score?: number;
          business_score?: number;
          engagement_score?: number;
          composite_score?: number;
          rank_position?: number | null;
          monthly_revenue?: number;
          total_clients?: number;
          total_leads?: number;
        };
        Update: {
          progress_score?: number;
          business_score?: number;
          engagement_score?: number;
          composite_score?: number;
          rank_position?: number | null;
          monthly_revenue?: number;
          total_clients?: number;
          total_leads?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "milestone" | "badge" | "community" | "task" | "system" | "win";
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "milestone" | "badge" | "community" | "task" | "system" | "win";
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          activity_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          activity_data?: Json | null;
        };
        Update: {
          activity_type?: string;
          activity_data?: Json | null;
        };
      };
      vault_resources: {
        Row: {
          id: string;
          user_id: string;
          resource_type: "doc" | "youtube" | "instagram" | "transcript" | "testimonial" | "other";
          url: string | null;
          file_path: string | null;
          title: string;
          extracted_text: string | null;
          file_size: number | null;
          content_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type?: "doc" | "youtube" | "instagram" | "transcript" | "testimonial" | "other";
          url?: string | null;
          file_path?: string | null;
          title?: string;
          extracted_text?: string | null;
          file_size?: number | null;
          content_type?: string | null;
        };
        Update: {
          resource_type?: "doc" | "youtube" | "instagram" | "transcript" | "testimonial" | "other";
          url?: string | null;
          file_path?: string | null;
          title?: string;
          extracted_text?: string | null;
          file_size?: number | null;
          content_type?: string | null;
        };
      };
      competitors: {
        Row: {
          id: string;
          user_id: string;
          market_analysis_id: string | null;
          competitor_name: string;
          positioning: string | null;
          pricing: string | null;
          strengths: string[] | null;
          weaknesses: string[] | null;
          gap_opportunity: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          market_analysis_id?: string | null;
          competitor_name?: string;
          positioning?: string | null;
          pricing?: string | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          gap_opportunity?: string | null;
          source?: string | null;
        };
        Update: {
          market_analysis_id?: string | null;
          competitor_name?: string;
          positioning?: string | null;
          pricing?: string | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          gap_opportunity?: string | null;
          source?: string | null;
        };
      };
      brand_identities: {
        Row: {
          id: string;
          user_id: string;
          offer_id: string | null;
          brand_names: Json | null;
          selected_name: string | null;
          art_direction: Json | null;
          logo_concept: string | null;
          brand_kit: Json | null;
          status: "draft" | "validated" | "active";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          offer_id?: string | null;
          brand_names?: Json | null;
          selected_name?: string | null;
          art_direction?: Json | null;
          logo_concept?: string | null;
          brand_kit?: Json | null;
          status?: "draft" | "validated" | "active";
        };
        Update: {
          offer_id?: string | null;
          brand_names?: Json | null;
          selected_name?: string | null;
          art_direction?: Json | null;
          logo_concept?: string | null;
          brand_kit?: Json | null;
          status?: "draft" | "validated" | "active";
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          custom_domain: string | null;
          primary_color: string;
          accent_color: string;
          brand_name: string | null;
          features: Json;
          limits: Json;
          owner_id: string;
          custom_onboarding_steps: Json | null;
          custom_welcome_message: string | null;
          custom_prompts: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          primary_color?: string;
          accent_color?: string;
          brand_name?: string | null;
          features?: Json;
          limits?: Json;
          owner_id: string;
          custom_onboarding_steps?: Json | null;
          custom_welcome_message?: string | null;
          custom_prompts?: Json | null;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          primary_color?: string;
          accent_color?: string;
          brand_name?: string | null;
          features?: Json;
          limits?: Json;
          custom_onboarding_steps?: Json | null;
          custom_welcome_message?: string | null;
          custom_prompts?: Json | null;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          role?: "owner" | "admin" | "member";
          joined_at?: string | null;
        };
      };
      agent_conversations: {
        Row: {
          id: string;
          user_id: string;
          agent_type: "general" | "offre" | "funnel" | "ads" | "vente" | "contenu" | "strategie" | "recherche";
          title: string | null;
          messages: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_type?: "general" | "offre" | "funnel" | "ads" | "vente" | "contenu" | "strategie" | "recherche";
          title?: string | null;
          messages?: Json;
        };
        Update: {
          agent_type?: "general" | "offre" | "funnel" | "ads" | "vente" | "contenu" | "strategie" | "recherche";
          title?: string | null;
          messages?: Json;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
        };
        Update: {
          content?: string;
          read?: boolean;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          provider_account_id: string | null;
          provider_user_id: string | null;
          provider_username: string | null;
          scopes: string[] | null;
          metadata: Json | null;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          provider_account_id?: string | null;
          provider_user_id?: string | null;
          provider_username?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
        };
        Update: {
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          provider_account_id?: string | null;
          provider_user_id?: string | null;
          provider_username?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
        };
      };
      challenge_completions: {
        Row: {
          id: string;
          user_id: string;
          challenge_key: string;
          week_key: string;
          xp_awarded: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_key: string;
          week_key: string;
          xp_awarded?: number;
        };
        Update: {
          xp_awarded?: number;
        };
      };
      ad_daily_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          spend: number;
          impressions: number;
          clicks: number;
          conversions: number;
          roas: number;
          ctr: number;
          cpm: number;
          cpa: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          roas?: number;
          ctr?: number;
          cpm?: number;
          cpa?: number;
        };
        Update: {
          spend?: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          roas?: number;
          ctr?: number;
          cpm?: number;
          cpa?: number;
        };
      };
      ab_tests: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          metric: string;
          target_sample_size: number;
          status: "active" | "paused" | "completed";
          winner: "A" | "B" | null;
          variant_a_description: string;
          variant_a_conversions: number;
          variant_a_traffic: number;
          variant_b_description: string;
          variant_b_conversions: number;
          variant_b_traffic: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          metric: string;
          target_sample_size?: number;
          status?: "active" | "paused" | "completed";
          variant_a_description: string;
          variant_b_description: string;
        };
        Update: {
          name?: string;
          metric?: string;
          target_sample_size?: number;
          status?: "active" | "paused" | "completed";
          winner?: "A" | "B" | null;
          variant_a_description?: string;
          variant_a_conversions?: number;
          variant_a_traffic?: number;
          variant_b_description?: string;
          variant_b_conversions?: number;
          variant_b_traffic?: number;
        };
      };
      ltv_cac_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          avg_deal_value: number;
          monthly_churn_rate: number;
          monthly_ad_spend: number;
          new_customers: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          avg_deal_value?: number;
          monthly_churn_rate?: number;
          monthly_ad_spend?: number;
          new_customers?: number;
        };
        Update: {
          avg_deal_value?: number;
          monthly_churn_rate?: number;
          monthly_ad_spend?: number;
          new_customers?: number;
        };
      };
      daily_performance_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          spend: number;
          impressions: number;
          clicks: number;
          leads: number;
          calls: number;
          clients: number;
          revenue: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          calls?: number;
          clients?: number;
          revenue?: number;
        };
        Update: {
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          calls?: number;
          clients?: number;
          revenue?: number;
        };
      };
      growth_checkpoints: {
        Row: {
          id: string;
          user_id: string;
          tier_id: string;
          checkpoint: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier_id: string;
          checkpoint: string;
        };
        Update: never;
      };
      meta_audiences: {
        Row: {
          id: string;
          user_id: string;
          meta_audience_id: string | null;
          name: string;
          description: string | null;
          audience_type: "custom" | "lookalike" | "saved";
          subtype: string | null;
          source_data: Json | null;
          approximate_count: number | null;
          temperature: string | null;
          targeting_spec: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meta_audience_id?: string | null;
          name: string;
          description?: string | null;
          audience_type?: "custom" | "lookalike" | "saved";
          subtype?: string | null;
          source_data?: Json | null;
          temperature?: string | null;
          targeting_spec?: Json | null;
          status?: string;
        };
        Update: {
          meta_audience_id?: string | null;
          name?: string;
          description?: string | null;
          audience_type?: "custom" | "lookalike" | "saved";
          subtype?: string | null;
          source_data?: Json | null;
          temperature?: string | null;
          targeting_spec?: Json | null;
          status?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
        };
      };
      revenue_entries: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string | null;
          campaign_name: string | null;
          creative_name: string | null;
          audience_name: string | null;
          channel: string | null;
          notes: string | null;
          entry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source?: string | null;
          campaign_name?: string | null;
          creative_name?: string | null;
          audience_name?: string | null;
          channel?: string | null;
          notes?: string | null;
          entry_date?: string;
        };
        Update: {
          amount?: number;
          source?: string | null;
          campaign_name?: string | null;
          creative_name?: string | null;
          audience_name?: string | null;
          channel?: string | null;
          notes?: string | null;
          entry_date?: string;
        };
      };
      sales_call_logs: {
        Row: {
          id: string;
          user_id: string;
          call_date: string;
          duration_minutes: number | null;
          outcome: string | null;
          revenue: number;
          main_objection: string | null;
          lead_source: string | null;
          notes: string | null;
          ai_score: number | null;
          ai_feedback: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          call_date?: string;
          duration_minutes?: number | null;
          outcome?: string | null;
          revenue?: number;
          main_objection?: string | null;
          lead_source?: string | null;
          notes?: string | null;
          ai_score?: number | null;
          ai_feedback?: Json | null;
        };
        Update: {
          call_date?: string;
          duration_minutes?: number | null;
          outcome?: string | null;
          revenue?: number;
          main_objection?: string | null;
          lead_source?: string | null;
          notes?: string | null;
          ai_score?: number | null;
          ai_feedback?: Json | null;
        };
      };
      ad_automation_config: {
        Row: {
          id: string;
          user_id: string;
          cpa_max: number;
          roas_min: number;
          ctr_min: number;
          frequency_max: number;
          scale_increment: number;
          scaling_rules: Json;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cpa_max?: number;
          roas_min?: number;
          ctr_min?: number;
          frequency_max?: number;
          scale_increment?: number;
          scaling_rules?: Json;
          enabled?: boolean;
        };
        Update: {
          cpa_max?: number;
          roas_min?: number;
          ctr_min?: number;
          frequency_max?: number;
          scale_increment?: number;
          scaling_rules?: Json;
          enabled?: boolean;
        };
      };
      ad_automation_log: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          creative_name: string | null;
          campaign_name: string | null;
          reason: string | null;
          details: Json | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          creative_name?: string | null;
          campaign_name?: string | null;
          reason?: string | null;
          details?: Json | null;
          status?: string;
        };
        Update: {
          action_type?: string;
          creative_name?: string | null;
          campaign_name?: string | null;
          reason?: string | null;
          details?: Json | null;
          status?: string;
        };
      };
      launch_checklist: {
        Row: {
          id: string;
          user_id: string;
          offer_ready: boolean;
          funnel_ready: boolean;
          market_validated: boolean;
          brand_ready: boolean;
          pixel_installed: boolean;
          integrations_ready: boolean;
          content_ready: boolean;
          audience_ready: boolean;
          all_passed: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          offer_ready?: boolean;
          funnel_ready?: boolean;
          market_validated?: boolean;
          brand_ready?: boolean;
          pixel_installed?: boolean;
          integrations_ready?: boolean;
          content_ready?: boolean;
          audience_ready?: boolean;
          all_passed?: boolean;
        };
        Update: {
          offer_ready?: boolean;
          funnel_ready?: boolean;
          market_validated?: boolean;
          brand_ready?: boolean;
          pixel_installed?: boolean;
          integrations_ready?: boolean;
          content_ready?: boolean;
          audience_ready?: boolean;
          all_passed?: boolean;
        };
      };
      content_batches: {
        Row: {
          id: string;
          user_id: string;
          week_number: number | null;
          year: number | null;
          content_pieces: Json;
          performance_input: string | null;
          objections_input: string | null;
          ai_raw_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_number?: number | null;
          year?: number | null;
          content_pieces?: Json;
          performance_input?: string | null;
          objections_input?: string | null;
          ai_raw_response?: Json | null;
        };
        Update: {
          week_number?: number | null;
          year?: number | null;
          content_pieces?: Json;
          performance_input?: string | null;
          objections_input?: string | null;
          ai_raw_response?: Json | null;
        };
      };
      academy_quiz_results: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          score: number;
          total_questions: number;
          passed: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          score: number;
          total_questions: number;
          passed?: boolean;
        };
        Update: {
          score?: number;
          total_questions?: number;
          passed?: boolean;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          status: string;
          notes: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          notes?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: string;
          notes?: string | null;
          avatar_url?: string | null;
        };
      };
      client_deals: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          title: string;
          amount: number;
          status: string;
          closed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          title: string;
          amount?: number;
          status?: string;
          closed_at?: string | null;
          notes?: string | null;
        };
        Update: {
          title?: string;
          amount?: number;
          status?: string;
          closed_at?: string | null;
          notes?: string | null;
        };
      };
      client_activities: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          type: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          type: string;
          description: string;
          metadata?: Json;
        };
        Update: {
          type?: string;
          description?: string;
          metadata?: Json;
        };
      };
      pipeline_leads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          source: string | null;
          status: string;
          notes: string | null;
          amount: number;
          assigned_to: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          notes?: string | null;
          amount?: number;
          assigned_to?: string | null;
          metadata?: Json;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          notes?: string | null;
          amount?: number;
          assigned_to?: string | null;
          metadata?: Json;
        };
      };
      pipeline_activities: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          action: string;
          old_status: string | null;
          new_status: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          user_id: string;
          action: string;
          old_status?: string | null;
          new_status?: string | null;
          notes?: string | null;
        };
        Update: {
          action?: string;
          old_status?: string | null;
          new_status?: string | null;
          notes?: string | null;
        };
      };
      drive_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          color?: string;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          color?: string;
        };
      };
      drive_files: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          name: string;
          file_url: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          name: string;
          file_url: string;
          file_size?: number;
          mime_type?: string;
        };
        Update: {
          folder_id?: string | null;
          name?: string;
          file_url?: string;
          file_size?: number;
          mime_type?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          content: string;
          chunk_index?: number;
          metadata?: Json;
        };
        Update: {
          content?: string;
          chunk_index?: number;
          metadata?: Json;
        };
      };
      roadmap_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          priority: string | null;
          due_date: string | null;
          estimated_minutes: number | null;
          completed: boolean;
          completed_at: string | null;
          task_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          priority?: string | null;
          due_date?: string | null;
          estimated_minutes?: number | null;
          completed?: boolean;
          task_order?: number | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string | null;
          priority?: string | null;
          due_date?: string | null;
          estimated_minutes?: number | null;
          completed?: boolean;
          completed_at?: string | null;
          task_order?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
