import type { Product } from "./products";

/** 全角英数→半角、小文字化 */
const norm = (s: string): string =>
  s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .toLowerCase();

/** ひらがな→カタカナ変換 */
const hiraToKata = (s: string): string =>
  s.replace(/[\u3041-\u3096]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60)
  );

/** ハイフン・中点などを除去 */
const stripPunct = (s: string): string => s.replace(/[-・\-\s]/g, "");

/**
 * 商品の「ユーザーが言いそうなキーワード」一覧を生成する
 * - シリーズ名・商品名・キャッチコピーから抽出
 * - カタカナ連続部分（どろんこ→ドロンコ など）も含む
 */
function buildHandles(p: Product): string[] {
  const sources = [p.name, p.series, p.catchcopy];
  const handles = new Set<string>();

  for (const src of sources) {
    const n = norm(src);
    handles.add(n);
    handles.add(stripPunct(n));

    // 区切り文字で分割した各ワード（2文字以上）
    n.split(/[\s　・\-\/（）()【】「」、。]+/)
      .filter((w) => w.length >= 2)
      .forEach((w) => {
        handles.add(w);
        handles.add(stripPunct(w));
      });

    // カタカナ連続部分を抽出（例: "ドロンコクレー24" → "ドロンコ"）
    const kataMatches = src.match(/[ァ-ヶー]{2,}/g);
    if (kataMatches) {
      kataMatches.forEach((k) => {
        handles.add(norm(k));
        // 最初の4文字以上のカタカナ語根も追加（例: "ドロンコ"）
        if (k.length >= 4) handles.add(norm(k.slice(0, 4)));
      });
    }
  }

  return [...handles].filter((h) => h.length >= 2);
}

/**
 * ユーザーメッセージに含まれる商品名・シリーズ名キーワードで
 * DBから該当商品を検索して返す
 *
 * マッチ例:
 *   "ゼロシリーズも提案して"  → series に"ゼロ"含む商品
 *   "Mu-2 について"           → Mu-2 シリーズ商品
 *   "美道のライン"            → 美道シリーズ商品
 *   "どろんこのやつ"          → ドロンコ系商品（ひらがな→カタカナ変換）
 */
export function searchProductsByKeyword(
  query: string,
  products: Product[]
): Product[] {
  if (!query.trim()) return [];

  // クエリを複数の形式に正規化
  const nq = norm(query);
  const nqKata = norm(hiraToKata(query)); // ひらがな→カタカナ変換版
  const nqStrip = stripPunct(nq); // 記号除去版

  return products.filter((p) => {
    const handles = buildHandles(p);
    return handles.some((h) => {
      const hs = stripPunct(h);
      return (
        nq.includes(h) ||
        nqKata.includes(h) ||
        (hs.length >= 2 && nqStrip.includes(hs))
      );
    });
  });
}
