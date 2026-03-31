export type SkinGoal = {
  id: string;
  label: string;
  enabled: boolean;
};

export const DEFAULT_GOALS: SkinGoal[] = [
  { id: "g1", label: "うるおいのあるもちもち肌", enabled: true },
  { id: "g2", label: "透き通るような透明感", enabled: true },
  { id: "g3", label: "毛穴が目立たないなめらか肌", enabled: true },
  { id: "g4", label: "ハリとツヤのある若々しい肌", enabled: true },
  { id: "g5", label: "肌トラブルのない健やかな素肌", enabled: true },
  { id: "g6", label: "洗練されたすっぴん美人", enabled: true },
  { id: "g7", label: "シンプルケアで整う肌", enabled: true },
  { id: "g8", label: "弾力のある肌", enabled: true },
  { id: "g9", label: "血色の良い肌", enabled: true },
];
