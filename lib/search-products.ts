import type { Product } from "./products";

// ── 正規化ユーティリティ ─────────────────────────────────

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

/** カタカナ→ひらがな変換 */
const kataToHira = (s: string): string =>
  s.replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );

/** ハイフン・中点・スペース系を除去 */
const stripPunct = (s: string): string => s.replace(/[-・\-\s　]/g, "");

// ── シリーズ別名テーブル ────────────────────────────────
//
// キー: DBに保存されているシリーズ名（またはシリーズを特定するキーワード）
// values: ユーザーが口頭・テキストで使いそうな別名（すべて norm() 済みで比較する）
//
// マッチの仕組み:
//   1. クエリを norm() → stripPunct() で正規化
//   2. ALIAS_TABLE の全エントリを走査
//   3. クエリにエイリアスが含まれていれば、そのシリーズに属する商品にマッチ

type AliasEntry = {
  /** DB上の series フィールドに含まれるべき文字列（部分一致） */
  seriesMatch: string;
  /** 全角→半角・小文字化済みの別名一覧 */
  aliases: string[];
};

export const SERIES_ALIAS_TABLE: AliasEntry[] = [
  {
    seriesMatch: "zero",   // "ZERO" を norm() すると "zero"
    aliases: [
      "zero", "ゼロ", "ぜろ",
    ].map(norm),
  },
  {
    seriesMatch: "美道",
    aliases: [
      "美道", "bidou", "びどう", "ビドウ", "美道シリーズ",
    ].map(norm),
  },
  {
    seriesMatch: "mu",     // "Mu-2" を norm()+stripPunct すると "mu2"
    aliases: [
      "mu-2", "mu2", "ミューツー", "みゅーつー", "ミュー2", "みゅー2", "ムー2", "mu",
    ].map((s) => stripPunct(norm(s))),
  },
  {
    seriesMatch: "ドロンコ",  // "ドロンコクレー24" の先頭部分
    aliases: [
      "どろんこ", "ドロンコ", "doronko", "どろ", "ドロ",
    ].map(norm),
  },
  {
    seriesMatch: "kohaku",   // "KO・HA・KU" を norm()+stripPunct → "kohaku"
    aliases: [
      "ko・ha・ku", "kohaku", "コハク", "こはく", "琥珀", "こうはく",
    ].map((s) => stripPunct(norm(s))),
  },
  {
    seriesMatch: "クレオリ",
    aliases: [
      "クレオリ", "くれおり", "creori", "クレオリ24",
    ].map(norm),
  },
];

// ── 商品ハンドル生成 ────────────────────────────────────

/**
 * 商品の「ユーザーが言いそうなキーワード」一覧を生成する
 * - シリーズ名・商品名・キャッチコピーから抽出
 * - カタカナ語根の分割も含む
 */
function buildHandles(p: Product): string[] {
  const sources = [p.name, p.series, p.catchcopy];
  const handles = new Set<string>();

  for (const src of sources) {
    if (!src) continue;
    const n = norm(src);
    const ns = stripPunct(n);
    handles.add(n);
    handles.add(ns);
    // ひらがな版・カタカナ版も追加
    handles.add(norm(hiraToKata(src)));
    handles.add(norm(kataToHira(src)));

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
        if (k.length >= 4) handles.add(norm(k.slice(0, 4)));
      });
    }
  }

  return [...handles].filter((h) => h.length >= 2);
}

// ── メイン検索関数 ─────────────────────────────────────

/**
 * ユーザーメッセージに含まれる商品名・シリーズ名キーワードで
 * DBから該当商品を検索して返す
 *
 * マッチ方法:
 *   A. 商品ハンドル直接マッチ（商品名・シリーズ名・キャッチコピー）
 *   B. シリーズ別名テーブルマッチ（表記ゆれ吸収）
 *
 * マッチ例:
 *   "ゼロシリーズも提案して"  → ZERO シリーズ商品（別名テーブル）
 *   "zero について"           → ZERO シリーズ商品（別名テーブル）
 *   "Mu-2 について"           → Mu-2 シリーズ商品
 *   "mu2 のクリーム"          → Mu-2 シリーズ商品（別名テーブル）
 *   "ミューツーのローション"   → Mu-2 シリーズ商品（別名テーブル）
 *   "美道のライン"            → 美道シリーズ商品
 *   "どろんこのやつ"          → ドロンコ系商品
 *   "kohaku シリーズ"         → KO・HA・KU 商品（別名テーブル）
 *   "コハクの化粧水"          → KO・HA・KU 商品（別名テーブル）
 */
export function searchProductsByKeyword(
  query: string,
  products: Product[]
): Product[] {
  if (!query.trim()) return [];

  // クエリを複数の形式に正規化
  const nq = norm(query);
  const nqHira = norm(kataToHira(query));       // カタカナ→ひらがな版
  const nqKata = norm(hiraToKata(query));        // ひらがな→カタカナ版
  const nqStrip = stripPunct(nq);               // 記号除去版
  const nqKataStrip = stripPunct(nqKata);

  // 別名テーブルから「クエリにマッチしたシリーズキー」を先に収集
  const matchedSeriesKeys = new Set<string>();
  for (const entry of SERIES_ALIAS_TABLE) {
    for (const alias of entry.aliases) {
      const aliasStrip = stripPunct(alias);
      if (
        nq.includes(alias) ||
        nqHira.includes(alias) ||
        nqKata.includes(alias) ||
        (aliasStrip.length >= 2 && nqStrip.includes(aliasStrip)) ||
        (aliasStrip.length >= 2 && nqKataStrip.includes(aliasStrip))
      ) {
        matchedSeriesKeys.add(entry.seriesMatch);
        break;
      }
    }
  }

  return products.filter((p) => {
    // B. 別名テーブルマッチ
    if (matchedSeriesKeys.size > 0) {
      const pSeriesNorm = stripPunct(norm(p.series ?? ""));
      for (const key of matchedSeriesKeys) {
        const keyNorm = stripPunct(norm(key));
        if (pSeriesNorm.includes(keyNorm) || keyNorm.includes(pSeriesNorm)) {
          return true;
        }
      }
    }

    // A. 商品ハンドル直接マッチ
    const handles = buildHandles(p);
    return handles.some((h) => {
      const hs = stripPunct(h);
      return (
        nq.includes(h) ||
        nqHira.includes(h) ||
        nqKata.includes(h) ||
        (hs.length >= 2 && nqStrip.includes(hs))
      );
    });
  });
}
