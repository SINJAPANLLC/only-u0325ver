import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Tag, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ColumnArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  publishedAt: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export default function ColumnDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: article, isLoading, error } = useQuery<ColumnArticle>({
    queryKey: ["/api/columns", slug],
    queryFn: async () => {
      const res = await fetch(`/api/columns/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const categoryLabel: Record<string, string> = {
    general: "一般", creator: "クリエイター", fan: "ファン", news: "ニュース", tips: "ヒント",
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "URLをコピーしました" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-3 mt-8">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">記事が見つかりませんでした</p>
          <Link href="/column">
            <Button variant="outline">コラム一覧へ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {article.metaDescription && (
        <meta name="description" content={article.metaDescription} />
      )}
      {article.metaKeywords && (
        <meta name="keywords" content={article.metaKeywords} />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/column" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            コラム一覧
          </Link>
          <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share">
            <Share2 className="h-4 w-4 mr-1" /> シェア
          </Button>
        </div>

        <article>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {article.category && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {categoryLabel[article.category] || article.category}
              </Badge>
            )}
            {article.publishedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" data-testid="text-article-title">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-muted-foreground text-base mb-8 leading-relaxed border-l-4 border-muted pl-4">
              {article.excerpt}
            </p>
          )}

          <div
            className="prose prose-sm md:prose max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:text-foreground prose-ol:text-foreground
              prose-blockquote:text-muted-foreground prose-blockquote:border-muted
              prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="content-article"
          />
        </article>

        <div className="mt-12 pt-8 border-t">
          <Link href="/column">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              コラム一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
