import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Truck, Tag as TagIcon, Building2, Factory, Users, Coins, ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function B2BMarketplace() {
  const [search, setSearch] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [originFilter, setOriginFilter] = useState("all");

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["b2b-products"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/b2b/products`);
      if (!res.ok) throw new Error("Failed to load B2B products");
      return res.json();
    },
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ["b2b-suppliers"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/suppliers`);
      if (!res.ok) throw new Error("Failed to load suppliers");
      return res.json();
    },
  });

  const products = useMemo(() => {
    let list = (productsResponse?.products || []).slice();
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(p =>
        (p.title || "").toLowerCase().includes(term) ||
        (p.brand || "").toLowerCase().includes(term) ||
        (p.category_name || "").toLowerCase().includes(term)
      );
    }
    if (minOrder) {
      const moq = Number(minOrder);
      if (!isNaN(moq)) list = list.filter(p => (p.moq || 1) <= moq);
    }
    if (maxPrice) {
      const mp = Number(maxPrice);
      if (!isNaN(mp)) list = list.filter(p => (p.wholesale_price_usd || p.price_usd || 0) <= mp);
    }
    if (originFilter !== "all") {
      list = list.filter(p => p.origin_country === originFilter);
    }
    return list;
  }, [productsResponse, search, minOrder, maxPrice, originFilter]);

  const origins = useMemo(() => {
    const set = new Set((productsResponse?.products || []).map(p => p.origin_country).filter(Boolean));
    return [...set];
  }, [productsResponse]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Wholesale Marketplace</h1>
              <p className="text-slate-400 mt-1">B2B bulk buying for African businesses — factory-direct pricing, MOQ from 1 unit</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Factory className="w-4 h-4" />
                {suppliersResponse?.total || 0}+ Verified Suppliers
              </Badge>
              <Badge variant="default" className="flex items-center gap-2 bg-slate-700 text-white">
                <Coins className="w-4 h-4" />
                Wholesale Pricing
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search products, brands, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={originFilter} onValueChange={(v) => setOriginFilter(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Origin country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">All Origins</SelectItem>
              {origins.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Max MOQ"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="w-full"
          />
          <Input
            type="number"
            placeholder="Max price (USD)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">{products.length} wholesale products</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No wholesale products found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or browse our supplier directory.</p>
            </div>
          ) : (
            products.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                <CardContent className="p-0 pt-5 relative overflow-hidden">
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Badge variant="destructive" className="text-xs uppercase tracking-wider font-semibold">
                      MOQ {p.moq || 1}
                    </Badge>
                    {p.b2b_only && (
                      <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-slate-200">
                        B2B Only
                      </Badge>
                    )}
                  </div>
                  <div className="aspect-video bg-slate-200 relative overflow-hidden">
                    {(p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Factory className="w-8 h-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardHeader className="px-5 pb-3">
                  <CardTitle className="line-clamp-1 text-base font-semibold">{p.title}</CardTitle>
                  <p className="text-xs text-slate-500">{p.brand || p.supplier_name || "Verified Supplier"} · {p.origin_country}</p>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-slate-900">
                      {formatMoney(p.wholesale_price_usd || p.price_usd || 0, "USD")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {p.origin_country} origin
                    </span>
                    <span className="flex items-center gap-1">
                      <TagIcon className="w-3 h-3" />
                      {p.bulk_discounts?.length > 0 ? "Bulk discounts" : "Flat pricing"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-medium"
                      onClick={() => {}}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" /> Request Quote
                    </Button>
                    <Button size="sm" className="w-full text-xs font-medium bg-primary text-white">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-black text-center mb-10">Why buy wholesale on AfriTrade?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center">
            <Coins className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Factory-Direct Pricing</h3>
            <p className="text-slate-600 text-sm">Wholesale prices direct from manufacturers across Africa and Asia — no middleman markup.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center">
            <TagIcon className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Flexible MOQ</h3>
            <p className="text-slate-600 text-sm">Minimum order quantities starting from 1 unit. Scale up as your business grows.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center">
            <Truck className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Pan-African Delivery</h3>
            <p className="text-slate-600 text-sm">Cross-border shipping to 10+ African countries with local last-mile partners.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
