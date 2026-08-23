---
name: rag-engineering
description: "Knowledge base distilled from a 210-page Chinese RAG handbook (《RAG 技术手册》). Use when designing, building, debugging, or evaluating a retrieval-augmented generation system — chunking strategy, embedding model selection, hybrid retrieval and RRF fusion, reranking, query rewriting and routing, vector store choice, RAG evaluation, or GraphRAG. Also use when a retrieval pipeline is underperforming and you need to diagnose whether the fault is in retrieval or generation."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# RAG 技术手册 — Engineering Knowledge Base

**Source**: 《RAG 技术手册》, 210 pages, Simplified Chinese (author not named in the file) | **Chapters**: 18 | **Generated**: 2026-08-21

## How to Use This Skill

- **No arguments** — the core frameworks below are the working toolkit
- **With a topic** — ask about `分塊`, `混合檢索`, `重排`, `評估`, `GraphRAG`; I read the matching chapter file
- **With a chapter** — ask for `ch07`; I load that file
- **Deciding something** — go straight to [cheatsheet.md](cheatsheet.md); it is decision rules only, no definitions

Chapter files load on demand and cost nothing until read.

---

## Core Frameworks & Mental Models

### 判斷 RAG 是否是對的工具
RAG 換的是**知識來源**，不是**推理能力**。它解決四件事：靜態知識局限、幻覺、領域專業性不足、資料隱私風險。需要多步推理、數學計算或創造性生成時，RAG 幫不上忙。

**語料小於一個 context window 時，直接塞進去** — 檢索只會移除資訊。

### 檢索是天花板
檢索回來的上下文充滿噪音時，**後續的生成模型再強也做不出正確答案**。優化順序永遠是檢索優先。這條原則貫穿全書。

### 塊不是越大越好 — 三個獨立機制
即使模型吃得下，大塊依然有害。三個機制發生在**不同階段**：
1. **索引期** — 池化把整塊壓成單一向量，塊越長資訊越稀釋
2. **生成期** — Lost in the Middle：LLM 記得頭尾忘中間
3. **檢索期** — 主題稀釋：混雜主題拉低整體相關性，**根本召不回來**

判準是**一個塊 = 一個主題**，不是「一個塊 = N 字元」。CJK 必須用 tokenizer 量長度，並加入 `。！？；` 分隔符。

### 稀疏與密集的失敗模式互補
- **稀疏（BM25）** — 精確匹配強，但有**詞彙鴻溝**：認不出「汽車」=「轎車」
- **密集** — 語義泛化強，但會**漏掉必須精確匹配的**型號、函式名、專有名詞

這是混合檢索存在的全部理由。**BGE-M3 一次前向傳播同時產出 dense 與 sparse**，且原生多語言。

### RRF 融合，c = 60
$$RRF(d) = \sum_i \frac{1}{rank_i(d) + c}, \quad c = 60$$

**只看排名不看分數**——這正是它的價值：一個通道回傳 cosine [-1,1]、另一個回傳無界 BM25 時，**不需要任何跨系統分數正規化**。代價是丟失原始分數資訊。

替代方案（加權線性 + α）需先歸一化，但 **min-max 在 top-k 切片上不穩定**，某通道結果少時尤其明顯。

### 重排的交互粒度光譜
精度與成本同步上升：**無交互 (RRF) → 概念級 (RankLLM) → 句子級 (Cross-Encoder) → Token 級 (ColBERT MaxSim)**。

只有 **ColBERT 的文件向量可預先計算**——這是它在生產環境的關鍵優勢。Cross-Encoder 精度最高但需 N 次獨立推理。

**重排只能改善已召回文件的順序。召不回來的，重排救不了。**

### 檢索進階三段式，假設層層放寬
| 階段 | 解決 | 假設 |
|---|---|---|
| 重排 | 順序不對 | 召回集裡有答案 |
| 壓縮 | 塊裡有噪音 | 召回大體正確 |
| **校正 (C-RAG)** | **檢索本身失敗** | **不做假設** |

C-RAG 打破的隱含假設是「**檢索到的文件總是相關且包含正確答案**」。三分支：正確 → 知識精煉；不正確 → 查詢重寫 + Web 搜尋；模糊 → 原查詢 + Web 搜尋。

### 使用者的原始問題不是最優的檢索輸入
四種查詢翻譯技術對應四種症狀：
- 多個子主題 → **Multi-query 分解**（並行檢索 + 合併去重）
- 過於具體易錯 → **Step-Back**（先問原理再推導）
- 短查詢 vs 長文件 → **HyDE**（生成假設文件再嵌入；**不必事實正確**）
- 排序/極值 → **LLM 生成 JSON 指令 + 程式碼執行**（向量檢索的盲區）

### 索引單位可以與生成單位解耦
**句子窗口檢索**：索引單句（精確檢索）+ 元資料存前後 N 句窗口（豐富生成）+ 後處理替換。必須設 `excluded_embed_metadata_keys`，否則窗口文字被拿去嵌入，精度回落。

**結構化索引**：先用元資料過濾縮小範圍，再向量搜尋。前置條件是**分塊階段就注入元資料**。

### RAG 三元組 — 評估的目的是歸因
| 維度 | 對應環節 | 分數低時修哪裡 |
|---|---|---|
| **上下文相關性** | 檢索器 | 分塊、混合檢索、重排 |
| **忠實度** | 生成器可靠性 | 提示詞或換模型（幻覺） |
| **答案相關性** | 端到端 | 生成階段的完整性 |

**忠實度 ≠ 答案相關性**：可以忠實度高（沒編造）但答案相關性低（只答一半）。

**檢索指標全部需要 ground truth**（P@k / R@k / F1 / MRR / MAP）。**LLM 裁判有評估者偏見**，數字當相對訊號用。

### 多跳推理是圖 RAG 的核心優勢
把**共現轉化為可遍歷的路徑**。兩個從未在同一句話中出現的實體，可透過中間節點建立關聯——這個關聯是**推導出來的，不是儲存的**。

GraphRAG 檢索**子圖**（社群/路徑/鄰域）而非孤立事實，這是可解釋性的來源。

### 安全紅線
- **`PandasQueryEngine` 用 `eval()` 執行 LLM 生成的程式碼，不可用於生產**
- Neo4j 生產環境用**軟刪除**，不物理刪除；刪除用 `DETACH DELETE`；建實體用 `MERGE` 不用 `CREATE`
- Text-to-SQL 生成的查詢應限唯讀並做語法/權限驗證

---

## Chapter Index

| # | 主題 | 關鍵框架 |
|---|---|---|
| [ch01](chapters/ch01-rag-foundations.md) | RAG 基礎 | 雙階段架構、演進三層、風險分級、MVP 四步 |
| [ch02](chapters/ch02-data-loading.md) | 資料載入 | GIGO、Unstructured 先理解後分割、元素型別 |
| [ch03](chapters/ch03-chunking.md) | 文本分塊 | 四種策略、**三個失敗機制**、兩階段分塊 |
| [ch04](chapters/ch04-embeddings.md) | 向量嵌入 | 三階段演進、MLM/NSP、度量學習、MTEB 選型 |
| [ch05](chapters/ch05-vector-stores.md) | 向量資料庫 | 四層架構、四類 ANN 索引、FAISS→Milvus 論證 |
| [ch06](chapters/ch06-index-optimization.md) | 索引優化 | **句子窗口檢索**、結構化索引、遞迴檢索 |
| [ch07](chapters/ch07-hybrid-retrieval.md) | 混合檢索 | 稀疏vs密集、BM25、**RRF c=60**、加權線性 |
| [ch08](chapters/ch08-reranking.md) | 重排序 | 交互粒度、Cross-Encoder、**ColBERT MaxSim**、RankLLM |
| [ch09](chapters/ch09-compression-correction.md) | 壓縮與校正 | 三種壓縮器、**C-RAG 檢索-評估-行動** |
| [ch10](chapters/ch10-query-translation.md) | 查詢翻譯 | Multi-query、**Step-Back**、**HyDE**、JSON 指令 |
| [ch11](chapters/ch11-query-routing.md) | 查詢路由 | LLM 意圖識別、嵌入相似性路由、Round-robin |
| [ch12](chapters/ch12-query-construction.md) | 查詢建構 | Metadata filter、Text-to-Cypher、**Text-to-SQL 三層優化** |
| [ch13](chapters/ch13-structured-generation.md) | 格式化生成 | Output Parsers、**Function Calling**、GBNF |
| [ch14](chapters/ch14-evaluation.md) | 評估 | **RAG 三元組**、P@k/R@k/F1/MRR/MAP、ROUGE/BLEU/METEOR |
| [ch15](chapters/ch15-eval-tooling.md) | 評估工具 | RAGAS、LlamaIndex Eval、Phoenix |
| [ch16](chapters/ch16-multimodal.md) | 多模態嵌入 | CLIP 雙編碼器、對比學習、**網格嵌入** |
| [ch17](chapters/ch17-knowledge-graphs.md) | 知識圖譜 | 三元組、Neo4j 四概念、NER+RE、KBQA |
| [ch18](chapters/ch18-graph-rag.md) | 圖 RAG | **多跳推理**、子圖檢索、四模組架構 |

## Topic Index

- **BGE-M3** → ch04, ch07, ch16
- **BM25 / 稀疏向量** → ch07
- **C-RAG / 校正** → ch09
- **ColBERT / MaxSim** → ch08
- **Cross-Encoder** → ch08
- **Cypher / Neo4j** → ch17
- **FAISS / Milvus** → ch05
- **Function Calling** → ch13
- **GraphRAG / 多跳推理** → ch17, ch18
- **HyDE** → ch10
- **Lost in the Middle** → ch03
- **MTEB / 嵌入選型** → ch04
- **Multi-query 分解** → ch10
- **RAG 三元組** → ch14
- **RAGAS / Phoenix** → ch15
- **RRF (c=60)** → ch07, ch08
- **Round-robin 融合** → ch11, ch18
- **Step-Back Prompting** → ch10
- **Text-to-SQL** → ch12
- **主題稀釋** → ch03
- **句子窗口檢索** → ch06
- **多模態 / CLIP** → ch16
- **壓縮 (Compression)** → ch09
- **查詢路由** → ch11
- **混合檢索** → ch07
- **結構化索引** → ch06
- **語義分塊** → ch03
- **資料載入 / Unstructured** → ch02
- **重排序** → ch08
- **風險分級** → ch01

## Supporting Files

- [cheatsheet.md](cheatsheet.md) — **決策規則**（該用哪個、什麼條件下、安全紅線）
- [patterns.md](patterns.md) — 所有具名技術的實作要點與取捨
- [glossary.md](glossary.md) — 術語定義，附章節索引

---

## Scope & Limits

涵蓋本書內容。三點說明：

1. **原書頁序與邏輯順序不一致**（各章串接時順序錯亂，且每章「第N節」編號各自重來，全書有 5 個「第一節」）。本 skill 的章節已**依 RAG 管線邏輯重排**，與原書頁碼不對應。
2. **原書的比較表格在 PDF 抽取後欄位錯亂**，本 skill 中的表格是**依內文重建**的，不是照抄碎片。
3. 原書大量程式碼示例以 LangChain / LlamaIndex / Milvus / Neo4j 為主。本 skill 保留了實作要點與 API 名稱，但完整程式碼請查各框架官方文檔——框架 API 變動頻繁。

書中對框架的立場值得複述：**「以原理為主——優先關心『它是如何工作的？』而不是『我該調用哪個函數？』」**
