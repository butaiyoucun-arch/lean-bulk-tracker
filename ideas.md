# Lean Bulk Tracker - デザインブレインストーミング

## 要件まとめ
- モバイルファースト PWA（iPhone Safari → ホーム画面追加）
- 全データは localStorage で管理（バックエンド不要）
- ホーム：睡眠記録（おはよう/おやすみ）、モーニングボディログ、今日のミッション、大谷シートモチベーション
- スケジュール：週間メニュー（筋トレ/ランニング/休養日）、過去日編集
- 振り返り：AIアドバイス、マッスルヒートマップ、今月の総距離、月別距離推移、睡眠、詳細分析、ボディフォトギャラリー
- 設定：大谷シート管理、Excel出力
- ボトムナビ：ホーム、スケジュール、振り返り、設定

---

<response>
<text>

## アイデア1: 「Warm Sunrise」 — ソフトニューモーフィズム × 温かみのある朝のパレット

**Design Movement**: Soft Neumorphism（ソフトニューモーフィズム）にJapanese Minimalism（和のミニマリズム）を融合

**Core Principles**:
1. 柔らかな凹凸感で触覚的なフィードバックを演出
2. 朝の光をイメージした暖色グラデーション
3. 余白を大切にした呼吸するレイアウト
4. 手書き風のアクセントで人間味を加える

**Color Philosophy**: 
- ベース: `#F5F0EB`（温かみのあるオフホワイト）
- プライマリ: `#E8734A`（朝焼けオレンジ）
- セカンダリ: `#5B6ABF`（夜空のインディゴ）
- アクセント: `#2ECC71`（達成のグリーン）
- 朝=暖色、夜=寒色で時間帯の感覚を自然に表現

**Layout Paradigm**: カード型スタッキングレイアウト。各セクションが独立したカードとして縦にスタック。カード間に十分な余白を確保し、各カードにニューモーフィズムの影を適用。

**Signature Elements**:
1. おはようボタンの太陽アニメーション（タップで光が広がる）
2. マッスルヒートマップの体のシルエットSVG（グラデーションで温度表現）
3. ボディフォトギャラリーのフィルムストリップ風横スクロール

**Interaction Philosophy**: タップ時にカードが軽く沈む感覚、スワイプでページ遷移、長押しで編集モード

**Animation**: 
- ページ遷移: フェードイン + 下からスライド（300ms ease-out）
- カードタップ: scale(0.97) → scale(1)（150ms）
- おはようボタン: 太陽の光線が放射状に広がるアニメーション
- 数値変化: カウントアップアニメーション

**Typography System**: 
- 見出し: Noto Sans JP Bold（700）
- 本文: Noto Sans JP Regular（400）
- 数値: DM Sans Bold（モダンな数字表示）
- アクセント: Zen Maru Gothic（丸みのある柔らかさ）

</text>
<probability>0.07</probability>
</response>

<response>
<text>

## アイデア2: 「Iron Discipline」 — ダークアスレチック × グリッドベースのダッシュボード

**Design Movement**: Athletic Dark UI（スポーツブランドのダッシュボード）にBrutalist Grid（ブルータリストグリッド）を融合

**Core Principles**:
1. ダークベースにネオンアクセントで戦闘的な雰囲気
2. データを前面に押し出すインフォグラフィック重視
3. 角張ったエッジとボールドタイポグラフィ
4. コントラストの強い色使いで視認性を最大化

**Color Philosophy**: 
- ベース: `#0D0D0D`（深い黒）
- プライマリ: `#FF4444`（炎の赤）
- セカンダリ: `#00E5FF`（電気ブルー）
- アクセント: `#FFD700`（ゴールド）
- 暗闘の中で光る意志の強さを表現

**Layout Paradigm**: タイトなグリッドシステム。情報密度を高く保ちつつ、セクション間はシャープなボーダーで区切る。

**Signature Elements**:
1. パルスするネオンの進捗バー
2. ヒートマップの炎エフェクト
3. グリッチエフェクトのトランジション

**Interaction Philosophy**: 即座のフィードバック、ハプティック感のある操作感

**Animation**: 
- グリッチ風のページ遷移
- パルスするプログレスバー
- カウントダウンタイマー風の数値表示

**Typography System**: 
- 見出し: Oswald Bold
- 本文: Roboto Condensed
- 数値: Space Mono

</text>
<probability>0.04</probability>
</response>

<response>
<text>

## アイデア3: 「Zen Growth」 — クリーンiOS × 自然の成長メタファー

**Design Movement**: iOS Native Design Language（Apple HIG準拠）に Organic Growth Metaphor（植物の成長）を融合

**Core Principles**:
1. iOSネイティブに限りなく近い操作感と見た目
2. 白ベースに淡いパステルカラーで清潔感
3. 丸みのあるカードと自然な影で奥行き
4. 成長を植物の芽吹きに例えたビジュアルメタファー

**Color Philosophy**: 
- ベース: `#FFFFFF` / `#F8F9FA`（純白 / ライトグレー）
- プライマリ: `#5856D6`（iOSパープル）
- 成功: `#34C759`（iOSグリーン）
- 警告: `#FF9500`（iOSオレンジ）
- 破壊: `#FF3B30`（iOSレッド）
- iOSのシステムカラーに準拠し、ネイティブアプリのような自然さを実現

**Layout Paradigm**: セクショングループ型レイアウト。iOS設定画面のようにグループ化されたセクション。各グループにヘッダーラベルを配置し、内部はリスト形式またはカード形式。スクロールは自然な慣性スクロール。

**Signature Elements**:
1. おはようボタンの朝露アニメーション（タップで水滴が弾ける）
2. マッスルヒートマップのグラデーション体シルエット（寒色→暖色→赤）
3. ボディフォトギャラリーのiOS写真アプリ風横スクロール（スナップポイント付き）

**Interaction Philosophy**: 
- iOSネイティブの操作感を忠実に再現
- スワイプバック、バウンススクロール、タップフィードバック
- モーダルはボトムシート形式
- 削除は左スワイプ

**Animation**: 
- ページ遷移: iOS風の右からスライドイン（350ms cubic-bezier(0.25, 0.1, 0.25, 1)）
- カードタップ: opacity 0.7 → 1.0（100ms）
- ボトムシート: 下からスライドアップ + 背景ブラー
- おはよう: 太陽が昇るアニメーション + モチベーション文字のフェードイン
- 数値: spring animation でバウンス
- リスト項目: staggered fade-in（各50ms遅延）

**Typography System**: 
- 見出し: SF Pro Display相当 → Inter Bold（700）
- 本文: SF Pro Text相当 → Inter Regular（400）
- 数値: SF Pro Rounded相当 → DM Sans Medium（500）
- サブテキスト: Inter Light（300）
- フォントサイズ階層: 34px / 22px / 17px / 15px / 13px（iOS HIG準拠）

</text>
<probability>0.08</probability>
</response>

---

## 選択: アイデア1「Warm Sunrise」

理由: 
- 元のアプリのスクリーンショットが温かみのある白ベース + オレンジ/パープルのカラーリングを使用しており、最も近い
- ニューモーフィズムの柔らかな影がモバイルアプリに適している
- 朝の習慣化アプリとして「朝焼け」のメタファーが最適
- iOS風の清潔感を保ちつつ、独自性のあるデザイン
