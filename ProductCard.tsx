"use client";
import { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <div className="product-card-inner">
        <div className="product-badge">
          {product.category === "doronko" ? "どろんこ" : 
           product.category === "kohaku" ? "琥珀" : 
           product.category === "set" ? "セット" : "おすすめ"}
        </div>
        <div className="product-series">{product.series}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-catchcopy">{product.catchcopy}</p>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{product.priceLabel}</span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="product-link"
          >
            詳しく見る →
          </a>
        </div>
      </div>
    </div>
  );
}
