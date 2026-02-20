"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";

const CATEGORIES = ["Tous", "Victoires", "Questions", "Ressources", "Feedback"] as const;

const MOCK_POSTS = [
  {
    id: 1,
    author: "Sophie M.",
    avatar: "SM",
    level: 15,
    category: "Victoires",
    content: "Premier client à 5K€ ce mois-ci grâce au funnel ScalingFlow ! L'offre irrésistible a tout changé. Merci à la communauté pour les retours sur ma VSL.",
    likes: 24,
    comments: 8,
    timeAgo: "2h",
    liked: false,
  },
  {
    id: 2,
    author: "Thomas D.",
    avatar: "TD",
    level: 14,
    category: "Questions",
    content: "Comment vous gérez le pricing quand le prospect compare avec des agences classiques ? Mon offre est à 3K€ mais certains me comparent à des freelances à 500€.",
    likes: 12,
    comments: 15,
    timeAgo: "5h",
    liked: true,
  },
  {
    id: 3,
    author: "Julie L.",
    avatar: "JL",
    level: 13,
    category: "Ressources",
    content: "Je partage mon template de séquence email qui convertit à 12%. 7 emails, framework PAS adapté aux offres IA. DM si vous voulez le détail !",
    likes: 45,
    comments: 22,
    timeAgo: "1j",
    liked: false,
  },
  {
    id: 4,
    author: "Marc B.",
    avatar: "MB",
    level: 12,
    category: "Feedback",
    content: "Le module sur les créatives Meta est incroyable. J'ai divisé mon CPA par 2 en appliquant la méthode des 5 hooks. Mon CTR est passé de 1.2% à 4.8%.",
    likes: 31,
    comments: 6,
    timeAgo: "2j",
    liked: false,
  },
];

interface PostFeedProps {
  className?: string;
}

export function PostFeed({ className }: PostFeedProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("Tous");
  const [posts, setPosts] = React.useState(MOCK_POSTS);
  const [newPost, setNewPost] = React.useState("");

  const filteredPosts = activeCategory === "Tous"
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const toggleLike = (id: number) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handleSubmit = () => {
    if (!newPost.trim()) return;
    setPosts([
      {
        id: Date.now(),
        author: "Moi",
        avatar: "ME",
        level: 7,
        category: "Questions",
        content: newPost,
        likes: 0,
        comments: 0,
        timeAgo: "maintenant",
        liked: false,
      },
      ...posts,
    ]);
    setNewPost("");
  };

  const categoryColor: Record<string, "default" | "blue" | "cyan" | "purple" | "muted"> = {
    Victoires: "cyan",
    Questions: "blue",
    Ressources: "default",
    Feedback: "purple",
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* New post */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Partage une victoire, pose une question..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={!newPost.trim()}>
              <Send className="h-4 w-4 mr-1" />
              Publier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeCategory === cat
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-bg-tertiary text-text-secondary text-xs">
                    {post.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{post.author}</span>
                    <Badge variant="muted" className="text-[10px]">Niv. {post.level}</Badge>
                  </div>
                  <span className="text-xs text-text-muted">{post.timeAgo}</span>
                </div>
                <Badge variant={categoryColor[post.category] || "muted"}>
                  {post.category}
                </Badge>
              </div>

              {/* Content */}
              <p className="text-sm text-text-secondary mb-4">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-border-default">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors",
                    post.liked ? "text-danger" : "text-text-muted hover:text-danger"
                  )}
                >
                  <Heart className={cn("h-4 w-4", post.liked && "fill-current")} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-info transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
