import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, FileText, Clock, Tag, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ColumnArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: string | null;
  metaKeywords: string | null;
}

export default function ColumnList() {
  const { data: articles = [], isLoading } = useQuery<ColumnArticle[]>({
    queryKey: ["/api/columns"],
  });

  const categoryLabel: Record<string, string> = {
    general: "一般", creator: "クリエイター", fan: "ファン", news: "ニュース", tips: "ヒント",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">コラム</h1>
            <p className="text-sm text-muted-foreground">Only-Uからのお役立ち情報</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>まだコラム記事がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <Link key={article.id} href={`/column/${article.slug}`}>
                <div className="border rounded-xl p-5 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`card-article-${article.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {article.category && (
                          <Badge variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {categoryLabel[article.category] || article.category}
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      )}
                      {article.publishedAt && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
