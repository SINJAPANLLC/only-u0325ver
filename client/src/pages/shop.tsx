import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Tag, Download, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  creatorName: string;
  creatorAvatar?: string;
  productType: "digital" | "physical";
  isAvailable: boolean;
}

function ProductCard({
  id,
  name,
  price,
  creatorName,
  creatorAvatar,
  productType,
  isAvailable,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-2xl overflow-hidden bg-card border border-card-border hover-elevate cursor-pointer"
      data-testid={`card-product-${id}`}
    >
      <div className="aspect-square bg-gradient-to-br from-primary/10 to-pink-400/10 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="h-12 w-12 text-primary/30" />
        </div>

        <Badge 
          className={`absolute top-2 left-2 gap-1 ${
            productType === "digital" 
              ? "bg-blue-500 border-0 text-white" 
              : "bg-emerald-500 border-0 text-white"
          }`}
          data-testid={`badge-product-type-${id}`}
        >
          {productType === "digital" ? (
            <>
              <Download className="h-3 w-3" />
              デジタル
            </>
          ) : (
            <>
              <Package className="h-3 w-3" />
              物販
            </>
          )}
        </Badge>

        {!isAvailable && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary" className="text-base">
              売り切れ
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold line-clamp-2 leading-tight" data-testid={`text-product-name-${id}`}>{name}</h3>
          <p className="text-lg font-bold text-primary mt-1" data-testid={`text-product-price-${id}`}>{formatPrice(price)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground" data-testid={`text-product-creator-${id}`}>{creatorName}</span>
        </div>

        <Button 
          className="w-full rounded-xl" 
          disabled={!isAvailable}
          data-testid={`button-buy-${id}`}
        >
          {isAvailable ? "購入する" : "売り切れ"}
        </Button>
      </div>
    </motion.div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
      <Skeleton className="aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

function EmptyProductState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Tag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2" data-testid="text-empty-products">商品がまだありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        クリエイターが商品を追加するとここに表示されます
      </p>
    </div>
  );
}

export default function Shop() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const displayProducts: ProductCardProps[] = products
    ? products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        creatorName: "Creator",
        productType: (p.productType || "digital") as "digital" | "physical",
        isAvailable: p.isAvailable ?? true,
      }))
    : [];

  const filteredProducts = displayProducts.filter((product) => {
    if (activeTab === "all") return true;
    if (activeTab === "digital") return product.productType === "digital";
    if (activeTab === "physical") return product.productType === "physical";
    return true;
  });

  return (
    <div className="pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/50">
          <TabsList className="w-full h-12 bg-transparent rounded-none justify-start px-4 gap-4">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              data-testid="tab-all"
            >
              すべて
            </TabsTrigger>
            <TabsTrigger 
              value="digital" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-1"
              data-testid="tab-digital"
            >
              <Download className="h-4 w-4" />
              デジタル
            </TabsTrigger>
            <TabsTrigger 
              value="physical" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-1"
              data-testid="tab-physical"
            >
              <Package className="h-4 w-4" />
              物販
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0 p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyProductState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
