import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// Use Facebook Graph API for Instagram Business/Creator accounts.
// The legacy https://graph.instagram.com endpoint (Basic Display API) is
// deprecated and does not support business fields like followers_count.
const INSTAGRAM_GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get Instagram connected account
    const { data: account } = await supabase
      .from("connected_accounts")
      .select("access_token, provider_username, metadata")
      .eq("user_id", user.id)
      .eq("provider", "instagram")
      .maybeSingle();

    if (!account) {
      return NextResponse.json(
        { connected: false, error: "Compte Instagram non connecté" },
        { status: 200 },
      );
    }

    const token = account.access_token;

    // Fetch profile data
    const profileRes = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me?fields=id,username,name,followers_count,media_count,profile_picture_url&access_token=${token}`,
    );

    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      console.error("Instagram profile error:", errBody);

      // If token expired, mark it (401 HTTP status or Facebook error code 190 in body)
      const isExpired =
        profileRes.status === 401 ||
        errBody.includes('"code":190') ||
        errBody.includes('"code": 190');
      if (isExpired) {
        return NextResponse.json(
          {
            connected: false,
            error: "Token expiré. Reconnecte ton compte Instagram.",
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de la récupération du profil Instagram" },
        { status: 500 },
      );
    }

    const profile = await profileRes.json();

    // Fetch recent media
    const mediaRes = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me/media?fields=id,caption,timestamp,like_count,comments_count,media_type,thumbnail_url,permalink,media_url&limit=12&access_token=${token}`,
    );

    let recentPosts: Array<{
      id: string;
      caption: string;
      timestamp: string;
      like_count: number;
      comments_count: number;
      media_type: string;
      thumbnail_url: string | null;
      media_url: string | null;
      permalink: string;
    }> = [];

    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      recentPosts = (mediaData.data || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (post: any) => ({
          id: post.id,
          caption: post.caption || "",
          timestamp: post.timestamp,
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          media_type: post.media_type || "IMAGE",
          thumbnail_url: post.thumbnail_url || null,
          media_url: post.media_url || null,
          permalink: post.permalink || "",
        }),
      );
    }

    // Calculate engagement rate
    const totalEngagement = recentPosts.reduce(
      (sum, p) => sum + p.like_count + p.comments_count,
      0,
    );
    const engagementRate =
      recentPosts.length > 0 && profile.followers_count > 0
        ? (
            (totalEngagement / recentPosts.length / profile.followers_count) *
            100
          ).toFixed(2)
        : "0";

    // Find top performing post
    const topPost =
      recentPosts.length > 0
        ? recentPosts.reduce((best, post) =>
            post.like_count + post.comments_count >
            best.like_count + best.comments_count
              ? post
              : best,
          )
        : null;

    return NextResponse.json({
      connected: true,
      profile: {
        username: profile.username || account.provider_username,
        name: profile.name || "",
        followers_count: profile.followers_count || 0,
        media_count: profile.media_count || 0,
        profile_picture_url: profile.profile_picture_url || null,
      },
      recentPosts,
      engagementRate: parseFloat(engagementRate),
      topPost,
    });
  } catch (error) {
    console.error("Instagram stats error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stats Instagram" },
      { status: 500 },
    );
  }
}
