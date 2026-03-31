"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/products";
import { SkinGoal } from "@/lib/goals";

// ── CSV パース ──────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
    else if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

type CSVRow = { id: string; name: string; price: number };

function parseCSV(text: string, genreFilter: string): { rows: CSVRow[]; skippedCount: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let skippedCount = 0;
  const rows: CSVRow[] = [];
  const allowedGenres = genreFilter.split(",").map((s) => s.trim()).filter(Boolean);
  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line);
    const id = cols[0]?.replace(/\s/g, "").trim();
    const name = cols[1]?.replace(/\s+/g, " ").trim();
    const price = parseFloat(cols[2]?.trim() || "0");
    const genre = cols[3]?.replace(/"/g, "").trim();
    const discontinued = cols[4]?.trim();
    if (!id || !name) continue;
    if (discontinued === "1" || price === 0) { skippedCount++; continue; }
    // ジャンルフィルタ（入力があれば適用）
    if (allowedGenres.length > 0 && !allowedGenres.includes(genre)) { skippedCount++; continue; }
    rows.push({ id, name, price });
  }
  return { rows, skippedCount };
}

type CSVPreview = {
  updates: { id: string; name: string; price: number; currentName: string }[];
  newItems: CSVRow[];
  skippedCount: number;
};

// ── コンポーネント ──────────────────────────────────────
export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  // スキンゴール state
  const [goals, setGoals] = useState<SkinGoal[]>([]);
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsMsg, setGoalsMsg] = useState("");
  const [goalsOpen, setGoalsOpen] = useState(false);

  // CSV import state
  const [csvFileName, setCsvFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [genreFilter, setGenreFilter] = useState("1");
  const [includeNew, setIncludeNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); });
    fetch("/api/goals").then((r) => r.json()).then(setGoals);
  }, []);

  const handleLogin = async () => {
    if (loading) { setAuthError("読み込み中です、少しお待ちください"); return; }
    setAuthError("");
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(products),
    });
    if (res.status === 401) { setAuthError("パスワードが違います"); }
    else { setAuthed(true); }
  };

  const updateField = (id: string, field: keyof Product, value: string | number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // ── スキンゴール ハンドラ ──
  const updateGoal = (id: string, field: keyof SkinGoal, value: string | boolean) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const moveGoal = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= goals.length) return;
    const arr = [...goals];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setGoals(arr);
  };

  const addGoal = () => {
    const id = `g${Date.now()}`;
    setGoals((prev) => [...prev, { id, label: "", enabled: true }]);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveGoals = async () => {
    setGoalsSaving(true);
    setGoalsMsg("");
    const res = await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(goals),
    });
    setGoalsSaving(false);
    setGoalsMsg(res.ok ? "✓ 保存しました" : "エラーが発生しました");
    setTimeout(() => setGoalsMsg(""), 3000);
  };

  const deleteProduct = (id: string) => {
    if (!confirm(`ID: ${id} の商品を削除しますか？`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(products),
    });
    setSaving(false);
    if (res.ok) { setMsg("✓ 保存しました"); }
    else if (res.status === 401) { setMsg("パスワードエラー — 再ログインしてください"); setAuthed(false); }
    else { setMsg("エラーが発生しました"); }
    setTimeout(() => setMsg(""), 3000);
  };

  // ── CSV ハンドラ ──
  const buildPreview = (text: string, filter: string) => {
    const { rows, skippedCount } = parseCSV(text, filter);
    const currentMap = new Map(products.map((p) => [p.id, p]));
    const updates: CSVPreview["updates"] = [];
    const newItems: CSVRow[] = [];
    for (const row of rows) {
      if (currentMap.has(row.id)) {
        updates.push({ ...row, currentName: currentMap.get(row.id)!.name });
      } else {
        newItems.push(row);
      }
    }
    setCsvPreview({ updates, newItems, skippedCount });
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      buildPreview(text, genreFilter);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleGenreFilterChange = (value: string) => {
    setGenreFilter(value);
    if (csvText) buildPreview(csvText, value);
  };

  const handleImport = async () => {
    if (!csvPreview) return;
    setImporting(true);
    const updatedProducts = products.map((p) => {
      const match = csvPreview.updates.find((u) => u.id === p.id);
      if (match) {
        return { ...p, name: match.name, price: match.price, priceLabel: `¥${match.price.toLocaleString("ja-JP")}` };
      }
      return p;
    });
    const addedProducts: Product[] = includeNew
      ? csvPreview.newItems.map((row) => ({
          id: row.id, name: row.name, price: row.price,
          priceLabel: `¥${row.price.toLocaleString("ja-JP")}`,
          series: "", category: "other" as const,
          concern: [], ideal: [], catchcopy: "", description: "", url: "",
        }))
      : [];
    const merged = [...updatedProducts, ...addedProducts];
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(merged),
    });
    if (res.ok) {
      setProducts(merged);
      setCsvPreview(null);
      setCsvFileName("");
      setIncludeNew(false);
      setMsg(`✓ インポート完了（更新${csvPreview.updates.length}件${includeNew ? `・追加${csvPreview.newItems.length}件` : ""}）`);
      setTimeout(() => setMsg(""), 4000);
    } else {
      setMsg("エラーが発生しました");
      setTimeout(() => setMsg(""), 3000);
    }
    setImporting(false);
  };

  // ── ログイン画面 ──
  if (!authed) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1 className="admin-title">YAMANO 管理画面</h1>
          <p className="admin-login-note">商品情報を編集できます</p>
          <input type="password" className="admin-input" placeholder="パスワード"
            value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {authError && <p className="admin-error">{authError}</p>}
          <button className="admin-btn-primary" onClick={handleLogin}>ログイン</button>
        </div>
      </div>
    );
  }

  // ── 管理画面 ──
  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">商品管理</h1>
        <div className="admin-header-right">
          {msg && <span className="admin-save-msg">{msg}</span>}
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </header>

      {/* CSV インポートセクション */}
      <div className="admin-import-section">
        <button className="admin-import-toggle" onClick={() => setImportOpen((v) => !v)}>
          <span>CSV一括インポート</span>
          <span className="admin-import-toggle-icon">{importOpen ? "▲" : "▼"}</span>
        </button>

        {importOpen && (
          <div className="admin-import-body">
            <p className="admin-import-note">
              CSVフォーマット：商品コード, 商品名, 上代価格, ジャンルコード, 終息, ...
              <br />終息フラグ=1・価格0の商品は自動でスキップされます。
            </p>

            <div className="admin-field">
              <label>ジャンルコードで絞り込み（カンマ区切りで複数指定可・空欄で全件）</label>
              <div className="admin-genre-row">
                <input
                  className="admin-input"
                  value={genreFilter}
                  onChange={(e) => handleGenreFilterChange(e.target.value)}
                  placeholder="例: 1　または　1,3"
                />
                <span className="admin-genre-hint">1=化粧品　2=寝具　3=サービス</span>
              </div>
            </div>

            <label className="admin-file-label">
              <input type="file" accept=".csv" onChange={handleCSVChange} style={{ display: "none" }} />
              <span className="admin-file-btn">CSVを選択</span>
              {csvFileName && <span className="admin-file-name">{csvFileName}</span>}
            </label>

            {csvPreview && (
              <div className="admin-csv-preview">
                <div className="admin-csv-stats">
                  <div className="admin-csv-stat-box">
                    <span className="admin-csv-stat-num">{csvPreview.updates.length}</span>
                    <span className="admin-csv-stat-label">件 更新</span>
                  </div>
                  <div className="admin-csv-stat-box new">
                    <span className="admin-csv-stat-num">{csvPreview.newItems.length}</span>
                    <span className="admin-csv-stat-label">件 新規</span>
                  </div>
                  <div className="admin-csv-stat-box skip">
                    <span className="admin-csv-stat-num">{csvPreview.skippedCount}</span>
                    <span className="admin-csv-stat-label">件 スキップ</span>
                  </div>
                </div>

                {csvPreview.updates.length > 0 && (
                  <div className="admin-csv-list">
                    <p className="admin-csv-list-title">更新される商品（名前・価格）</p>
                    {csvPreview.updates.slice(0, 8).map((u) => (
                      <div key={u.id} className="admin-csv-item">
                        <span className="admin-csv-id">{u.id}</span>
                        <span className="admin-csv-old">{u.currentName}</span>
                        <span className="admin-csv-arrow">→</span>
                        <span className="admin-csv-new">{u.name}　¥{u.price.toLocaleString("ja-JP")}</span>
                      </div>
                    ))}
                    {csvPreview.updates.length > 8 && (
                      <p className="admin-csv-more">…他 {csvPreview.updates.length - 8} 件</p>
                    )}
                  </div>
                )}

                {csvPreview.newItems.length > 0 && (
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={includeNew} onChange={(e) => setIncludeNew(e.target.checked)} />
                    新規商品も追加する（{csvPreview.newItems.length}件・説明文は後で編集可）
                  </label>
                )}

                {csvPreview.updates.length === 0 && !includeNew && (
                  <p className="admin-csv-warn">既存商品と一致するIDがありません。新規追加を有効にするか、別のCSVを選択してください。</p>
                )}

                <button
                  className="admin-btn-primary"
                  onClick={handleImport}
                  disabled={importing || (csvPreview.updates.length === 0 && !includeNew)}
                >
                  {importing ? "インポート中..." : "インポート実行"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* スキンゴール設定 */}
      <div className="admin-import-section">
        <button className="admin-import-toggle" onClick={() => setGoalsOpen((v) => !v)}>
          <span>スキンゴール設定</span>
          <span className="admin-import-toggle-icon">{goalsOpen ? "▲" : "▼"}</span>
        </button>

        {goalsOpen && (
          <div className="admin-import-body">
            <p className="admin-import-note">
              「どんなお肌になりたいですか？」の選択肢を管理します。
            </p>
            <div className="admin-goals-list">
              {goals.map((g, i) => (
                <div key={g.id} className="admin-goal-row">
                  <div className="admin-goal-move">
                    <button onClick={() => moveGoal(i, -1)} disabled={i === 0}>↑</button>
                    <button onClick={() => moveGoal(i, 1)} disabled={i === goals.length - 1}>↓</button>
                  </div>
                  <input
                    type="checkbox"
                    className="admin-goal-toggle"
                    checked={g.enabled}
                    onChange={(e) => updateGoal(g.id, "enabled", e.target.checked)}
                    title={g.enabled ? "表示中（クリックで非表示）" : "非表示（クリックで表示）"}
                  />
                  <input
                    className="admin-input admin-goal-input"
                    value={g.label}
                    onChange={(e) => updateGoal(g.id, "label", e.target.value)}
                    placeholder="ボタンのテキスト"
                  />
                  <button className="admin-btn-delete" onClick={() => deleteGoal(g.id)}>削除</button>
                </div>
              ))}
            </div>
            <button className="admin-btn-add" onClick={addGoal}>＋ 追加</button>
            <div className="admin-goals-footer">
              {goalsMsg && <span className="admin-save-msg">{goalsMsg}</span>}
              <button className="admin-btn-primary" onClick={handleSaveGoals} disabled={goalsSaving}>
                {goalsSaving ? "保存中..." : "スキンゴールを保存"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 商品一覧編集 */}
      <div className="admin-products">
        {products.map((p) => (
          <div key={p.id} className="admin-product-card">
            <div className="admin-product-meta">
              <span className="admin-product-id">ID: {p.id}</span>
              <span className="admin-product-series">{p.series}</span>
              <button className="admin-btn-delete" onClick={() => deleteProduct(p.id)}>削除</button>
            </div>
            <div className="admin-field">
              <label>商品名</label>
              <input className="admin-input" value={p.name}
                onChange={(e) => updateField(p.id, "name", e.target.value)} />
            </div>
            <div className="admin-field">
              <label>価格（円）</label>
              <input className="admin-input" type="number" value={p.price}
                onChange={(e) => updateField(p.id, "price", Number(e.target.value))} />
            </div>
            <div className="admin-field">
              <label>キャッチコピー</label>
              <input className="admin-input" value={p.catchcopy}
                onChange={(e) => updateField(p.id, "catchcopy", e.target.value)} />
            </div>
            <div className="admin-field">
              <label>説明文</label>
              <textarea className="admin-textarea" value={p.description} rows={3}
                onChange={(e) => updateField(p.id, "description", e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-footer-note">
        ※ Vercel Redisに保存されます。再起動・再デプロイ後も保持されます。
      </div>
    </div>
  );
}
