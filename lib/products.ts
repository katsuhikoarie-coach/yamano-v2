export type Product = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  series: string;
  category: "doronko" | "kohaku" | "set" | "hair" | "body" | "other";
  concern: string[]; // 対応する肌悩み
  ideal: string[];   // 対応する理想の肌
  catchcopy: string;
  description: string;
  url: string;
};

export const PRODUCTS: Product[] = [
  // ドロンコクレー24（エントリー・コア商品）
  {
    id: "303",
    name: "ヤマノ肌 ドロンコクレー24 WH（白どろ）",
    price: 4500,
    priceLabel: "¥4,500",
    series: "ドロンコクレー24",
    category: "doronko",
    concern: ["毛穴", "くすみ", "ざらつき", "ニキビ", "古い角質"],
    ideal: ["透明感", "つるつる", "毛穴レス", "素肌美人"],
    catchcopy: "白い泥で、毛穴の奥までやさしくリセット",
    description:
      "天然の白い泥（カオリン）が毛穴に詰まった皮脂や古い角質を吸着。洗い上がりはつるんとした素肌に。白どろは乾燥肌・普通肌の方に。",
    url: "https://yamanobeautymate.com/product/doronko-clay24/",
  },
  {
    id: "304",
    name: "ヤマノ肌 ドロンコクレー24 BK（黒どろ）",
    price: 4500,
    priceLabel: "¥4,500",
    series: "ドロンコクレー24",
    category: "doronko",
    concern: ["毛穴", "テカリ", "ニキビ", "皮脂過多"],
    ideal: ["毛穴レス", "さらさら", "透明感"],
    catchcopy: "黒い泥が、皮脂と毛穴の詰まりをごっそり吸着",
    description:
      "活性炭配合の黒い泥が、過剰な皮脂と毛穴汚れをしっかり吸着。脂性肌・混合肌の方に特におすすめ。",
    url: "https://yamanobeautymate.com/product/doronko-clay24/",
  },
  // Mu-2シリーズ
  {
    id: "38",
    name: "ヤマノ肌 Mu-2 ドロンコ クレンジングミルク",
    price: 6200,
    priceLabel: "¥6,200",
    series: "Mu-2",
    category: "doronko",
    concern: ["乾燥", "くすみ", "毛穴", "メイク汚れ"],
    ideal: ["うるおい", "透明感", "つるつる"],
    catchcopy: "泥のミルクで、クレンジングしながら肌に栄養を",
    description:
      "どろんこ成分がメイクや汚れを包んで落とすミルククレンジング。洗い流した後も突っ張らず、しっとりとした洗い上がり。",
    url: "https://yamanobeautymate.com/product/mu-2/",
  },
  {
    id: "39",
    name: "ヤマノ肌 Mu-2 ドロンコ フェイシャルクリーム",
    price: 6200,
    priceLabel: "¥6,200",
    series: "Mu-2",
    category: "doronko",
    concern: ["乾燥", "ハリ不足", "くすみ"],
    ideal: ["うるおい", "もちもち", "ツヤ肌"],
    catchcopy: "泥の栄養で、肌の奥からふっくらと",
    description:
      "どろんこ由来のミネラル成分をたっぷり配合したフェイシャルクリーム。乾燥が気になる季節にも肌をしっかり守る。",
    url: "https://yamanobeautymate.com/product/mu-2/",
  },
  {
    id: "40",
    name: "ヤマノ肌 Mu-2 KO・HA・KU エモリエントローション",
    price: 7500,
    priceLabel: "¥7,500",
    series: "Mu-2",
    category: "kohaku",
    concern: ["乾燥", "ハリ不足", "くすみ", "ごわつき"],
    ideal: ["うるおい", "透明感", "ツヤ肌", "もちもち"],
    catchcopy: "琥珀エキスが角層のすみずみまで浸透し、みずみずしく",
    description:
      "バルト海産の天然琥珀エキス配合。皮膚をやわらげ、うるおいをぐんぐん引き込む。日本化粧品検定協会推奨。",
    url: "https://yamanobeautymate.com/product/mu-2/",
  },
  {
    id: "41",
    name: "ヤマノ肌 Mu-2 KO・HA・KU モイスチュア ミルクローション",
    price: 7800,
    priceLabel: "¥7,800",
    series: "Mu-2",
    category: "kohaku",
    concern: ["乾燥", "ハリ不足", "ごわつき"],
    ideal: ["うるおい", "もちもち", "やわらか肌"],
    catchcopy: "琥珀のうるおいが一日中、肌を包み込む",
    description:
      "琥珀エキスとセラミド類似成分が肌のバリア機能をサポート。乾燥しやすい肌でもしっとりとした質感が長続き。",
    url: "https://yamanobeautymate.com/product/mu-2/",
  },
  // KO・HA・KU単品
  {
    id: "7525",
    name: "KO・HA・KU オールインワンジェル",
    price: 4200,
    priceLabel: "¥4,200",
    series: "KO・HA・KU",
    category: "kohaku",
    concern: ["乾燥", "ハリ不足", "時短したい"],
    ideal: ["うるおい", "もちもち", "シンプルケア"],
    catchcopy: "琥珀の恵みを、これ一本でまるごと届ける",
    description:
      "化粧水・乳液・美容液・クリームの4役をこなすオールインワンジェル。琥珀エキス配合でうるおいをしっかりチャージ。忙しい朝や旅先にも。",
    url: "https://yamanobeautymate.com/product/",
  },
  {
    id: "7526",
    name: "KO・HA・KU パワーエキスオールインワン 美溶液EX",
    price: 5200,
    priceLabel: "¥5,200",
    series: "KO・HA・KU",
    category: "kohaku",
    concern: ["乾燥", "ハリ不足", "くすみ", "毛穴"],
    ideal: ["うるおい", "ツヤ肌", "もちもち", "透明感"],
    catchcopy: "琥珀の高濃度エキスで、肌を根本から底上げ",
    description:
      "通常のオールインワンより高濃度の琥珀エキスを配合した美容液タイプ。ハリ・うるおい・透明感を同時に叶える贅沢な一本。",
    url: "https://yamanobeautymate.com/product/",
  },
  // クレオリ24シリーズ（セット向け）
  {
    id: "871",
    name: "ヤマノ肌 クレオリ24 4点セット（WH）",
    price: 17500,
    priceLabel: "¥17,500",
    series: "クレオリ24",
    category: "set",
    concern: ["乾燥", "毛穴", "くすみ", "ハリ不足"],
    ideal: ["うるおい", "透明感", "もちもち", "毛穴レス", "素肌美人"],
    catchcopy: "どろんこ×琥珀の全工程を、このセットひとつで",
    description:
      "クレンジングクリーム・フェイシャルクリーム・スキンローション・ミルクローションの4点セット。洗う→整える→うるおす、全行程をどろんこと琥珀でカバー。",
    url: "https://yamanobeautymate.com/product/",
  },
  {
    id: "7523",
    name: "ヤマノ肌 超シンプルスキンケアセット",
    price: 5900,
    priceLabel: "¥5,900",
    series: "ヤマノ肌",
    category: "set",
    concern: ["乾燥", "肌荒れ", "シンプルにしたい"],
    ideal: ["うるおい", "シンプルケア", "素肌美人"],
    catchcopy: "引き算スキンケアで、肌本来の力を取り戻す",
    description:
      "必要なものだけに絞ったシンプル2ステップセット。余分な添加物を省き、どろんこ・琥珀の力だけで整える基本のケア。",
    url: "https://yamanobeautymate.com/product/",
  },
  // 美道シリーズ（上位ライン）
  {
    id: "7611",
    name: "美道 ドロンコクレンジングクリーム",
    price: 10500,
    priceLabel: "¥10,500",
    series: "美道",
    category: "doronko",
    concern: ["毛穴", "くすみ", "乾燥", "ごわつき", "年齢肌"],
    ideal: ["透明感", "ツヤ肌", "うるおい", "もちもち"],
    catchcopy: "美容家・山野愛子のどろんこ美容を、毎日の洗顔に",
    description:
      "山野愛子が提唱した「どろんこ美容」を受け継ぐ上位ライン。濃密な泥が毛穴の奥まで届き、洗い上がりはしっとりなめらか。",
    url: "https://yamanobeautymate.com/product/bidou/",
  },
  {
    id: "7613",
    name: "美道 コハクスキンローション",
    price: 12500,
    priceLabel: "¥12,500",
    series: "美道",
    category: "kohaku",
    concern: ["乾燥", "ハリ不足", "くすみ", "年齢肌"],
    ideal: ["ツヤ肌", "うるおい", "透明感", "もちもち"],
    catchcopy: "琥珀の時間を、肌に刻む",
    description:
      "数千万年の時を経た琥珀エキスの力を凝縮。角層深くまで浸透し、ふっくらとしたハリとツヤを引き出す美道シリーズの要。",
    url: "https://yamanobeautymate.com/product/bidou/",
  },
];

export const CONCERNS = [
  "乾燥・カサカサ",
  "毛穴の開き・詰まり",
  "くすみ・透明感不足",
  "ハリ・弾力不足",
  "ニキビ・肌荒れ",
  "テカリ・皮脂",
  "ごわつき・かたさ",
  "シミ・色ムラ",
  "シワ・たるみ",
];

export const IDEALS = [
  "うるおいのあるもちもち肌",
  "透き通るような透明感",
  "毛穴が目立たないなめらか肌",
  "ハリとツヤのある若々しい肌",
  "肌トラブルのない健やかな素肌",
  "洗練されたすっぴん美人",
  "シンプルケアで整う肌",
];

export function getRecommendedProducts(
  concerns: string[],
  ideals: string[]
): Product[] {
  const scored = PRODUCTS.map((p) => {
    let score = 0;
    concerns.forEach((c) => {
      if (p.concern.some((pc) => c.includes(pc) || pc.includes(c.split("・")[0]))) score += 2;
    });
    ideals.forEach((i) => {
      if (p.ideal.some((pi) => i.includes(pi) || pi.includes(i.split("の")[0]))) score += 1;
    });
    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.product);
}
