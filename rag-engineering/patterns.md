# RAG 技術與模式

所有具名技術的實作要點。決策看 `cheatsheet.md`，術語看 `glossary.md`。

---

## 兩階段分塊 (Structure-then-Recursive)
**When to use**: Markdown / HTML / LaTeX 等有明確結構標記的文件。
**How**:
1. `MarkdownHeaderTextSplitter` 按標題階層切成大邏輯塊，標題路徑自動存入元資料
2. 對這些邏輯塊套用 `RecursiveCharacterTextSplitter` 切到符合 `chunk_size`
3. 所有小塊**繼承第一步的標題元資料**
**Trade-offs**: 兩次處理成本，換得宏觀結構保留 + 大小可控 + 元資料免費產生。是結構化索引的前置步驟。（ch03）

## 遞迴字元分塊 (Recursive Character Splitting)
**When to use**: 通用預設。
**How**: 分隔符階層由粗到細遍歷，找到第一個存在的分隔符切分。片段仍過大則遞迴用下一級分隔符。終止條件：`if not new_separators`。
- 預設分隔符：`["\n\n", "\n", " ", ""]`
- **CJK 必須加入** `。！？；`
**Trade-offs**: 比固定大小分塊更能處理超長段落（會繼續細分而非只發警告），代價是遞迴開銷。（ch03）

## 語義分塊 (Semantic Chunking)
**When to use**: 主題混雜的長文，願意付嵌入成本。
**How**:
1. 句子分割
2. **上下文感知嵌入** — 每句與前後各 `buffer_size`（預設 1）句組合後才嵌入
3. 計算相鄰句嵌入的餘弦距離
4. 依統計方法定動態閾值識別斷點
5. 依斷點合併成塊
**Trade-offs**: 塊內語義一致性最好，但需對全文做嵌入計算。（ch03）

## 句子窗口檢索 (Sentence Window Retrieval)
**When to use**: 小塊精確 vs 大塊上下文的矛盾（幾乎總是）。
**How**: **為檢索精確性而索引小塊，為上下文豐富性而檢索大塊**
1. 索引：切成單句，每句一個 Node；元資料存前後各 N 句的窗口（`window_size` 預設 3）。**窗口文字不被索引**
2. 檢索：在單句節點上做相似度搜尋
3. 後處理：`MetadataReplacementPostProcessor` 用窗口內容**替換**節點的單句內容
4. 生成：含豐富上下文的節點傳給 LLM
**關鍵**：必須設 `excluded_embed_metadata_keys` 與 `excluded_llm_metadata_keys`，排除 `window` 與 `original_text`，否則精度回落。
**Trade-offs**: 索引體積增加（元資料存了重複文字），換得檢索精度與生成品質同時最佳。（ch06）

## 結構化索引 (Structured Indexing)
**When to use**: 知識庫規模大（數百個文件），單一查詢只與少數文件相關。
**How**: **先過濾，再搜尋**
1. 元資料預過濾（`document_type == '財報'` AND `year == 2023` AND `quarter == 'Q2'`）
2. 在過濾後的小集合中做向量搜尋
**Trade-offs**: 需要分塊階段就注入元資料；換得檢索範圍大幅縮小、效率與準確性顯著提升。（ch06）

## 遞迴檢索 (Recursive Retrieval)
**When to use**: 結構化資料分散在多個來源（多工作表、多資料庫）。
**How**:
1. 每個來源建一個查詢引擎
2. 每個來源建一個 `IndexNode`（內容是摘要），作為頂層「指標」
3. 用所有 `IndexNode` 建 `VectorStoreIndex`（**不含詳細資料，只含指標**）
4. `RecursiveRetriever` 配 `retriever_dict` + `query_engine_dict`
**Trade-offs**: ⚠️ 用 `PandasQueryEngine` 實作有 `eval()` 安全風險，**不可用於生產**。安全替代見下。（ch06）

## 路由與檢索分離 (Safe Recursive Alternative)
**When to use**: 需要遞迴檢索能力但不能接受 `eval()` 風險。
**How**: 建兩個獨立索引
1. **摘要索引（路由用）** — 每來源一個極簡摘要 Document，建輕量索引，唯一職責是路由
2. **內容索引（問答用）** — 實際資料 + 元資料標籤 `{"sheet_name": "..."}`
3. 兩步查詢：先在摘要索引路由拿到目標 → 在內容索引檢索並附加 `MetadataFilter` 強制限定範圍
**Trade-offs**: 兩份索引的維護成本，換得零程式碼執行風險。（ch06）

---

## 混合檢索 (Hybrid Search)
**When to use**: 幾乎總是——除非確定查詢只有一種型態。
**How**: 並行執行稀疏與密集檢索，融合兩組異質結果。
**Trade-offs**:
- 優勢：召回率與準確率高、靈活性強、容錯性好（關鍵詞檢索可彌補向量模型對拼寫錯誤與罕見詞的敏感性）
- 局限：計算資源消耗大（兩套索引）、參數調試複雜、**融合後排序理由難以直觀分析**（ch07）

## RRF (Reciprocal Rank Fusion)
**When to use**: 融合任意多個異質檢索器的結果。**預設選擇。**
**How**: $RRF(d) = \sum_i \frac{1}{rank_i(d) + c}$，**c = 60**
**Trade-offs**: 尺度無關（不需跨系統分數正規化）、零樣本（無需訓練）；代價是**丟失原始相似度分數的資訊**——兩個排名相鄰但分數差距懸殊的文件看不出差別。（ch07, ch08）

## 加權線性融合 (Weighted Linear Combination)
**When to use**: 需明確調控語義 vs 關鍵詞的貢獻比例。
**How**: 先歸一化到 0-1，再 $Hybrid = \alpha \cdot Dense + (1-\alpha) \cdot Sparse$
**Trade-offs**: 保留分數資訊、權重可解釋；但 **min-max 歸一化在 top-k 切片上不穩定**（某通道結果少時尤其明顯），且 α 需反覆調優。（ch07）

## Round-robin 輪詢合併
**When to use**: 融合多路結果但不想調權重。
**How**: 按固定輪轉順序交替取——來源A[0]、來源B[0]、來源A[1]、來源B[1]…
**Trade-offs**: 公平調度算法，實作簡單穩定、無需調參、自然保持多樣性；代價是**完全不考慮分數**。（ch11, ch18）

---

## Cross-Encoder 重排
**When to use**: Top-K 精排，能接受延遲。
**How**: Query 與 Doc 拼接成 `[CLS] query [SEP] document [SEP]` 送入 Transformer，輸出單一相關性分數（0–1）。
**Trade-offs**: 精度最高（查詢與文件同時被分析，注意力可跨越兩者）；代價是 **N 次獨立模型推理**且**文件向量無法預先計算**。模型：`ms-marco-MiniLM-L-12-v2`、`ms-marco-TinyBERT-L-2-v2`。（ch08）

## ColBERT 後期交互 (Late Interaction)
**When to use**: 需接近 Cross-Encoder 精度但要可規模化。
**How**:
1. **獨立編碼** — Query 與 Doc 的**每個 token** 各自產生嵌入。**文件向量可預先計算並儲存**
2. **後期交互** — 計算查詢每個 token 與文件所有 token 的**最大相似度 (MaxSim)**
3. **分數聚合** — 所有查詢 token 的最大相似度**相加**
**實作**: `similarity_matrix.max(dim=1).values` 做 MaxSim，`.sum()` 聚合
**Trade-offs**: 避開昂貴的聯合編碼，同時比只比 `[CLS]` 的雙編碼器捕捉更細粒度的詞彙級交互。LangChain **沒有內建**，需繼承 `BaseDocumentCompressor` 自行實作。（ch08）

## 壓縮管道 (DocumentCompressorPipeline)
**When to use**: 需要串接多個後處理步驟（如重排 → 壓縮）。
**How**: `ContextualCompressionRetriever` 包住 `base_retriever` 與 `pipeline_compressor`。Pipeline **依序**調用 `transformers` 列表中的每個處理器。
**Trade-offs**: 組合靈活；注意輸出可能重複（書中留作練習）。（ch08, ch09）

## C-RAG (Corrective RAG)
**When to use**: 檢索可能失敗時（即：所有真實系統）。
**How**: **檢索 → 評估 → 行動**
1. 檢索（同標準 RAG）
2. **評估** — 檢索評估器對每個文件給出 **正確 / 不正確 / 模糊**
3. **行動**：
   - **正確** → 知識精煉：分解成 strips，過濾無關部分，重組成更聚焦的上下文
   - **不正確** → 知識搜尋：**查詢重寫** → Web 搜尋
   - **模糊** → 知識搜尋：**直接用原查詢** Web 搜尋
**實作**: LangChain `langgraph`（圖結構支援條件判斷與循環）
**Trade-offs**: 增加評估成本與延遲；換得系統「知道自己失敗了」的能力，大幅減少幻覺。（ch09）

---

## Multi-query 分解
**When to use**: 問題含多個子主題或意圖。
**How**: LLM 從不同角度分解成多個子問題 → 並行檢索 → **合併去重** → 交給 LLM
**實作**: LangChain `MultiQueryRetriever`
**Trade-offs**: 1 次 LLM 呼叫 + N 次檢索；顯著豐富檢索結果。**必須去重**否則浪費上下文預算。（ch10）

## Step-Back Prompting
**When to use**: 問題細節繁多或過於具體，直接作答易錯。Google DeepMind 提出。
**How**:
1. **抽象化** — 生成更高層次的「退步問題」，探尋背後的通用原理
2. **推理** — 先答退步問題得到原理，再結合原始問題推導
**Trade-offs**: 2 次 LLM 呼叫；換得更堅實的邏輯基礎。（ch10）

## HyDE (Hypothetical Document Embeddings)
**When to use**: 查詢短、文件長，兩者在向量空間存在鴻溝。
**How**:
1. **生成** — LLM 生成一個詳細的、可能是理想答案的假設性文件。**不必符合事實**，但需語義上與好答案高度相關
2. **編碼** — 用對比編碼器（如 Contriever）轉為向量
3. **檢索** — 用這個向量做相似性搜尋
**Trade-offs**: 把「查詢→文件」轉成「文件→文件」匹配；代價是 1 次額外 LLM 呼叫。（ch10）

## LLM 生成可執行指令
**When to use**: 排序、比較、極值查詢（向量檢索的盲區）。
**How**: 提示 LLM 輸出結構化 JSON 指令（而非改寫查詢），程式碼解析並執行。
- 「時間最短的影片」→ `{"sort_by": "length", "order": "asc"}`
**Trade-offs**: 把 LLM 從「文字改寫員」提升為「生成可執行計畫的代理」。補上 `SelfQueryRetriever` 的排序缺口。（ch10, ch12）

## LLM 意圖識別路由
**When to use**: 多資料源/多組件，需要靈活路由。
**How**（LCEL 三步）:
1. `classifier_chain` 對問題打分類標籤
2. `RunnableBranch` 定義路由規則（if-elif-else）
3. 組合：並行產生 `topic` 與保留 `question` → 傳給 `router_branch`
**Trade-offs**: 最靈活；代價是一次 LLM 呼叫的延遲。**必須有規則基礎的降級路徑。**（ch11）

## 嵌入相似性路由
**When to use**: 延遲敏感、路由邏輯簡單。
**How**（四步）:
1. 為每個路由寫詳細文字描述並向量化
2. 用 `route_map` 字典對應路由名稱與鏈
3. `route` 函數計算相似度選最相似的
4. `RunnableLambda` 包裝成可執行鏈
**Trade-offs**: 無 LLM 呼叫所以快；但只能做文字相似度匹配，處理不了複雜路由邏輯。（ch11）

---

## Text-to-SQL 三層優化
**When to use**: 自然語言查詢關聯式資料庫。
**How**（投報率由高到低）:
1. **提供 `CREATE TABLE` DDL** — 最基礎也最關鍵，等於給 LLM 一張地圖
2. **提供 few-shot「問題-SQL」示例對**
3. **RAG 增強** — 為資料庫建知識庫：DDL + 欄位業務描述 + **同義詞與業務術語映射**（「花費」→ `cost`）+ 複雜查詢示例
**Trade-offs**: 三大挑戰是幻覺（想像不存在的表/欄位）、模式理解不足、輸入模糊性。（ch12）

## PydanticOutputParser
**When to use**: 需要嚴格驗證的結構化輸出。
**How**:
1. 用 `BaseModel` 定義類別。**`Field` 的 `description` 直接作為指令餵給模型**
2. `get_format_instructions()` 提取 JSON Schema 並嵌入提示模板
3. LCEL 串接 `prompt | llm | parser`
4. 兩步解析：JSON → 字典 → `model_validate()` 驗證。失敗拋 `OutputParserException`
**Trade-offs**: 比純提示工程可靠；但仍依賴模型輸出格式正確。（ch13）

## Function Calling
**When to use**: 需要與外部工具互動，或需要最高可靠性的結構化輸出。
**How**（六步）:
1. 以 JSON Schema 定義工具（`name` / `description` / `parameters`）。**描述品質直接決定模型能否正確選用工具**
2. 使用者提問
3. 模型回傳含 `tool_calls` 的響應（不直接回答）
4. 程式碼解析並**實際執行**工具
5. 結果包裝成 `role: tool` 訊息回傳模型
6. 模型結合原問題與工具結果生成最終答案
**Trade-offs**: 可靠性最高 + **包含意圖到函數的映射** + 是 AI Agent 的基礎；需模型原生支援。（ch13）

---

## 合成評測集生成
**When to use**: 沒有標註資料集的冷啟動。
**How**: LlamaIndex `DatasetGenerator` 從文件自動生成問題-答案對（`QueryResponseDataset`）；RAGAS 支援合成資料生成。**存到本地避免重複生成。**
**Trade-offs**: 大幅降低評估門檻；但生成的問題會echo原文用詞，可能虛高詞彙匹配類指標。（ch15）

## 忠實度的 Claims 分解評估
**When to use**: 量化幻覺程度。
**How**:
1. 把生成的答案**分解為一系列獨立的聲明/斷言 (Claims)**
2. 對每個斷言在上下文中驗證真偽
3. 忠實度 = **被證實的斷言所佔比例**
**Trade-offs**: 把無法直接打分的主觀判斷轉成一組可逐一驗證的二元判斷。（ch14）

## 批次評估 (BatchEvalRunner)
**When to use**: 對比多個 RAG 策略。
**How**: 準備資料集 → 建多個 `QueryEngine` → 初始化評估器（`FaithfulnessEvaluator` / `RelevancyEvaluator`）→ `BatchEvalRunner` **並行**執行 → 計算平均分對比
**Trade-offs**: 核心用途是**在方案之間做決策**，不是給絕對分數。LLM 裁判有偏見。（ch15）

---

## 多跳推理 (Multi-hop Reasoning)
**When to use**: 查詢需跨越多個實體關係。圖 RAG 的核心優勢。
**How**:
1. **路徑發現** — 尋找連接起始與目標實體的路徑
2. **關係傳遞** — 透過中間節點傳遞語義關係
3. **隱含推理** — 發現原始資料中未明確表達的關聯
**Trade-offs**: 能發現傳統檢索找不到的隱含關係；需要圖資料庫基礎設施。（ch18）

## GraphRAG 子圖檢索
**When to use**: 需要可解釋的、基於關係結構的檢索。微軟提出。
**How**:
1. 從問題中識別**核心實體與約束**
2. 在圖中檢索相關**子圖**（社群/路徑/鄰域）——**而非孤立事實**
3. 子圖的結構化資訊作為上下文輸入 LLM
**Trade-offs**: 準確且可解釋；需維護圖譜。（ch17, ch18）

## Neo4j 圖譜建構安全模式
**When to use**: 建構與維護知識圖譜。
**How**:
- 建實體用 **`MERGE`** 配 `ON CREATE SET` / `ON MATCH SET`（避免重複），搭配 `coalesce(prop, default)`
- 刪除用 **`DETACH DELETE`**（Neo4j 不允許刪除有關係的節點）
- 生產環境用**軟刪除**：`SET i.is_active = false`，查詢時加 `WHERE i.is_active = true`
**Trade-offs**: 軟刪除保留圖完整性與審計能力，代價是查詢需多一個過濾條件。（ch17）
