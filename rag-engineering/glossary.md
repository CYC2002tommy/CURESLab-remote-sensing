# RAG 術語表

依英文/拼音字母排序。括號內為章節。

**ALIGN** — 多模態模型，證明了利用海量噪聲資料進行大規模訓練的有效性 (ch16)

**ANN (Approximate Nearest Neighbor)** — 近似最近鄰查詢。用精度換速度，在數十億級向量中實現毫秒級查詢 (ch05)

**Annoy** — 基於隨機投影樹的 ANN 索引，樹形結構實現對數複雜度搜尋 (ch05)

**Answer Relevance (答案相關性)** — RAG 三元組之一。評估系統端到端表現：最終答案是否直接、完整且有效回答了原始問題 (ch14)

**BaseDocumentCompressor** — LangChain 中實現自訂重排器/壓縮器的核心基類，需實作 `compress_documents` (ch08)

**BatchEvalRunner** — LlamaIndex 的批次評估管理器，可並行執行 (ch15)

**BGE-M3** — BAAI 開發的嵌入模型。M3 = 多語言性（100+ 語言）、多功能性（dense/sparse/multi-vector 一次產出）、多粒度性（8192 token）。基於 XLM-RoBERTa (ch04, ch07, ch16)

**BLEU** — 精確率導向的生成評估指標，含長度懲罰 (Brevity Penalty)。關心「說對了沒，長度是否合適」 (ch14)

**BLIP** — 多模態模型系列，專注細粒度的圖文理解與生成 (ch16)

**BM25** — 基於稀疏表示的經典排序算法。含詞頻飽和度參數 $k_1$ 與文件長度歸一化參數 $b$ (ch07)

**Breakpoint (斷點)** — 語義分塊中，相鄰句子嵌入距離超過閾值的切分位置 (ch03)

**C-RAG (Corrective RAG)** — 校正檢索。「檢索 → 評估 → 行動」三階段，評估器輸出正確/不正確/模糊 (ch09)

**Chroma** — 輕量級開源向量資料庫，本地優先、零配置、無依賴。適合原型與小規模應用 (ch05)

**CLIP (Contrastive Language-Image Pre-training)** — OpenAI 的圖文多模態模型。雙編碼器 + 對比學習 + 零樣本 (ch16)

**`[CLS]`** — BERT 等 Transformer 模型在輸入開頭添加的特殊標記，透過自注意力動態聚合整個序列的上下文，其最終向量被訓練用作代表全局語義的嵌入 (ch03, ch04)

**ColBERT (Contextualized Late Interaction over BERT)** — 後期交互重排模型。獨立編碼 + MaxSim + 分數聚合。文件向量可預先計算 (ch08)

**CompositeElement** — Unstructured 分塊處理產生的複合元素型別，由一或多個連續文字元素組合而成 (ch02)

**Context Relevance (上下文相關性)** — RAG 三元組之一。評估檢索器效能：檢索到的上下文是否與查詢高度相關 (ch14)

**ContextualCompressionRetriever** — LangChain 包裝器，包在基礎檢索器外，用 `DocumentCompressor` 處理召回結果 (ch08, ch09)

**Contrastive Learning (對比學習)** — 建構三元組 (Anchor, Positive, Negative)，最小化 d(A,P) 同時最大化 d(A,N)。跨模態對齊的核心技術 (ch04, ch16)

**Cypher** — Neo4j 的宣告式圖查詢語言，語法靈感來自 SQL 但針對圖特性優化 (ch17)

**DETACH DELETE** — Cypher 指令，自動刪除節點及所有直接相連的關係。官方推薦的刪除方式 (ch17)

**DocumentCompressorPipeline** — LangChain 管道，依序調用列表中的每個處理器，可組合「重排 → 壓縮」 (ch08)

**Docling** — IBM 生態的模組化企業級文檔解析工具，適合企業合約與報告 (ch02)

**Embedding (向量嵌入)** — 將複雜高維資料對象轉換為低維、稠密、連續數值向量的技術。向量是語義的數學編碼 (ch04)

**EmbeddingsFilter** — LangChain 壓縮器，依相似度閾值過濾文件。成本最低（無 LLM 呼叫） (ch09)

**EVA-CLIP** — Visualized_BGE 使用的視覺編碼器基礎 (ch16)

**F1-Score** — 精確率與召回率的調和平均：$F_1 = 2 \cdot \frac{P \times R}{P + R}$ (ch14)

**Faithfulness / Groundedness (忠實度/可信度)** — RAG 三元組之一。評估生成器可靠性：答案是否完全基於提供的上下文。量化幻覺程度 (ch14)

**FAISS (Facebook AI Similarity Search)** — 高效能向量搜尋函式庫（非資料庫）。索引存為本地 `.faiss` + `.pkl` 檔案。五個硬限制：純函式庫、無持久化、單機、元資料弱、高並發受限 (ch05)

**FireCrawlLoader** — 網頁內容抓取載入器，適合線上文檔與新聞 (ch02)

**Function Calling / Tool Calling** — LLM 原生的工具調用能力。六步流程，回傳 `tool_calls`。核心價值是「意圖到函數的映射」，是 AI Agent 的基礎 (ch13)

**GBNF (GGML BNF)** — 語法約束檔案。對本地部署的開源模型強制約束輸出的每一個 token 都符合預定義語法。最嚴格可靠的非 Function Calling 方法 (ch13)

**GIGO (Garbage In, Garbage Out)** — 垃圾進，垃圾出。資料載入章節的核心告誡 (ch02)

**GloVe** — 靜態詞嵌入模型 (2014)，融合全局詞-詞共現矩陣的統計資訊 (ch04)

**GraphRAG** — 微軟提出的融合方案。把知識圖譜作為外部知識庫，基於圖結構進行「子圖檢索」而非檢索孤立事實 (ch17, ch18)

**Grid-Based Embeddings (網格嵌入)** — BGE-M3 的視覺處理創新。將圖像分割為多個網格單元並獨立編碼，提升局部細節捕捉能力 (ch16)

**Hit Rate (命中率)** — 檢索評估指標：檢索到的上下文中是否包含正確答案 (ch15)

**HNSW (分層可導航小世界圖)** — 基於圖的 ANN 索引，多層鄰近圖結構實現快速搜尋 (ch05)

**HyDE (Hypothetical Document Embeddings)** — 查詢翻譯技術。生成假設性文件再嵌入檢索，把「查詢→文件」轉成「文件→文件」匹配。假設文件不必事實正確 (ch10)

**IndexNode** — LlamaIndex 遞迴檢索中作為「指標」的摘要節點 (ch06)

**INSTRUCTOR** — 支援指令的嵌入模型，用於領域自適應 (ch04)

**IVF / PQ** — FAISS 的基於量化的索引方法，透過聚類與量化壓縮向量 (ch05)

**KBQA (基於知識圖譜的問答)** — 意圖識別 → 槽位填充 → 知識查詢 → 回覆生成。在業務邏輯明確的場景中準確性與可解釋性不可替代 (ch17)

**LCEL (LangChain Expression Language)** — 用 `|` 管道符號串接組件的宣告式方法。底層自動做並行、非同步與串流優化 (ch11)

**Late Interaction (後期交互)** — ColBERT 的核心機制。獨立編碼後才計算 token 級交互 (ch08)

**Lexical Gap (詞彙鴻溝)** — 稀疏檢索無法識別同義詞的根本缺陷（「汽車」≠「轎車」） (ch07)

**LlamaParse** — 深度 PDF 結構解析的商業 API，適合法律合約與學術論文 (ch02)

**LLMChainExtractor** — LangChain 壓縮器，用 LLM 提取文件中與查詢相關的部分（內容提取） (ch09)

**LLMChainFilter** — LangChain 壓縮器，用 LLM 判斷整個文件是否相關（文件過濾） (ch09)

**Lost in the Middle** — LLM 處理長上下文時傾向記住開頭與結尾、忽略中間的現象。Liu et al. (2023) (ch03)

**LSH (局部敏感雜湊)** — 基於雜湊的 ANN 索引，將相似向量映射到同一「桶」 (ch05)

**MAP (Mean Average Precision)** — 綜合性檢索指標，同時評估精確率與相關文件的排名 (ch14)

**Marker** — PDF → Markdown 轉換工具，GPU 加速，專注科研文獻與書籍 (ch02)

**MarkdownHeaderTextSplitter** — LangChain 的結構分塊器，依標題階層切分並自動注入標題路徑元資料 (ch03)

**MaxSim** — ColBERT 的核心運算：為查詢每個 token 向量，從文件所有 token 向量中找最相似的 (ch08)

**MERGE** — Cypher 的「存在則更新、不存在則建立」指令。配 `ON CREATE SET` / `ON MATCH SET`。建構圖譜避免重複的關鍵 (ch17)

**MetadataFilter** — 強制限定搜尋範圍的元資料過濾器 (ch06)

**MetadataReplacementPostProcessor** — LlamaIndex 後處理器，用元資料中的窗口內容替換節點的單句內容 (ch06)

**METEOR** — 綜合精確率與召回率的生成評估指標，透過詞幹與同義詞匹配捕捉語義相似性 (ch14)

**Metric Learning (度量學習)** — 以相似度為優化目標的訓練策略。**關鍵在優化排序關係，而非追求絕對值** (ch04)

**Milvus** — 開源分散式向量資料庫，支援 GPU 加速與多種索引算法，可處理億級向量。原生支援 `SPARSE_FLOAT_VECTOR` (ch05)

**MinerU** — 多模態整合解析工具，整合 LayoutLMv3 + YOLOv8，適合學術文獻與財務報表 (ch02)

**MLM (Masked Language Model)** — BERT 的預訓練任務。隨機遮蓋 15% 的 token 讓模型預測 (ch04)

**Modality Wall (模態牆)** — 文字向量與圖像向量處於相互隔離空間的問題 (ch16)

**MRR (Mean Reciprocal Rank)** — 評估系統將第一個相關文件排在靠前位置的能力。適用於使用者只關心第一個正確答案的場景 (ch14)

**MTEB (Massive Text Embedding Benchmark)** — Hugging Face 維護的文本嵌入模型評測基準。**是篩選工具不是決策依據** (ch04)

**MultiQueryRetriever** — LangChain 的多查詢分解檢索器 (ch10)

**NER (命名實體識別)** — 從文本中識別並抽取特定類別的實體，成為圖譜的節點 (ch17)

**Neo4j** — 主流開源圖資料庫。四概念：節點、標籤、關係、屬性 (ch17)

**NSP (Next Sentence Prediction)** — BERT 的預訓練任務之一。**RoBERTa 等研究發現它可能過於簡單甚至損害效能，許多現代模型已放棄** (ch04)

**OpenTelemetry** — Phoenix 插樁所依據的開放標準，讓它與框架解耦 (ch15)

**OutputParserException** — `PydanticOutputParser` 驗證失敗時拋出的例外 (ch13)

**PandasQueryEngine** — LlamaIndex 的表格查詢引擎。⚠️ **實驗性功能，用 `eval()` 執行 LLM 生成的程式碼，強烈不建議用於生產** (ch06)

**Phoenix (Arize)** — 開源 LLM 可觀測性與評估平台。追蹤分析型，適合生產環境監控、Bad Case 分析、資料漂移偵測 (ch15)

**Pinecone** — 完全託管的 Serverless 向量資料庫。99.95% SLA，延遲 <100ms (ch05)

**Pooling (池化)** — 把所有 token 向量壓成單一向量（`[CLS]` 或 mean pooling）。大塊資訊損失的根源 (ch03, ch04)

**Precision@k (上下文精確率)** — 前 k 個結果中相關文件所佔比例。高精確率 = 噪音少 (ch14)

**PydanticOutputParser** — LangChain 最嚴格的輸出解析器，透過 Pydantic 模型定義與驗證 (ch13)

**Qdrant** — Rust 開發的高效能開源向量資料庫，支援二進位量化，RPS > 4000 (ch05)

**RAG (Retrieval-Augmented Generation)** — 融合資訊檢索與文本生成的技術範式。在 LLM 生成前先從外部知識庫檢索相關資訊 (ch01)

**RAG Triad (RAG 三元組)** — 評估架構：上下文相關性 + 忠實度 + 答案相關性。源自 TruLens (ch14)

**RAGAS (RAG Assessment)** — 獨立的開源 RAG 評估框架。支援無參考評估。四指標：`faithfulness`、`context_recall`、`context_precision`、`answer_relevancy` (ch15)

**RankLLM** — 直接利用 LLM 進行重排的方法類別 (ch08)

**RE (關係抽取)** — 判斷實體之間存在何種語義關係，成為圖譜的邊 (ch17)

**Recall@k (上下文召回率)** — 前 k 個結果中找到的相關文件佔所有真實相關文件的比例。高召回率 = 沒漏掉關鍵資訊 (ch14)

**RecursiveCharacterTextSplitter** — LangChain 的遞迴字元分塊器。預設分隔符 `["\n\n", "\n", " ", ""]`，CJK 需加 `。！？；` (ch03)

**RecursiveRetriever** — LlamaIndex 的遞迴檢索器，配 `retriever_dict` 與 `query_engine_dict` (ch06)

**Response Synthesis (響應合成)** — LlamaIndex 組件。模式包括 `refine`（逐塊迭代優化）與 `compact`（壓進單次調用） (ch13)

**ROUGE** — 召回率導向的生成評估指標。關心「說全了沒」。變體：ROUGE-N、ROUGE-L (ch14)

**Round-robin 輪詢合併** — 公平調度算法，按位置輪流從不同結果列表選擇。無需調權重，自然保持多樣性 (ch11, ch18)

**RRF (Reciprocal Rank Fusion)** — 倒數排序融合。$RRF(d) = \sum_i \frac{1}{rank_i(d)+c}$，**c = 60**。尺度無關、零樣本 (ch07, ch08)

**RunnableBranch** — LCEL 的條件分支組件，作用類似 if-elif-else (ch11)

**SelfQueryRetriever** — LangChain 的自查詢檢索器。⚠️ **無法正確處理需要排序或比較的查詢** (ch10, ch12)

**Semantic Chunking (語義分塊)** — 依語義主題變化切分。四種斷點法：`percentile`(95)、`standard_deviation`(3)、`interquartile`(1.5)、`gradient`(95) (ch03)

**SentenceEmbeddingOptimizer** — LlamaIndex 壓縮後處理器，分解成句子後只保留相似度最高的 (ch09)

**Sentence Window Retrieval (句子窗口檢索)** — 為檢索精確性而索引小塊，為上下文豐富性而檢索大塊 (ch06)

**SentenceWindowNodeParser** — LlamaIndex 節點解析器，核心邏輯在 `build_window_nodes_from_documents`。`window_size` 預設 3 (ch06)

**Soft Delete (軟刪除)** — 生產環境的安全刪除做法。`SET is_active = false`，查詢時過濾。資料保留以備審計或恢復 (ch17)

**Sparse Vector (稀疏向量／詞法向量)** — 基於詞頻統計的高維向量，絕大多數元素為零。可解釋性極強，但有詞彙鴻溝 (ch07)

**Step-Back Prompting (退步提示)** — Google DeepMind 提出。抽象化 → 推理兩步，先探尋通用原理再推導細節 (ch10)

**Strips (知識片段)** — C-RAG 知識精煉階段把文件分解成的更小單位 (ch09)

**Text-to-Cypher** — 把自然語言轉成 Cypher 圖查詢 (ch12)

**Text-to-SQL** — 把自然語言轉成 SQL。三大挑戰：幻覺、模式理解不足、輸入模糊性 (ch12)

**Topic Dilution (主題稀釋)** — 單一塊包含多個不相關主題，導致整體相關性分數被拉低而召不回 (ch03)

**tool_calls** — 模型決定使用工具時回傳的特殊響應欄位 (ch13)

**Triples (三元組)** — 知識圖譜的基本結構：（實體）-[關係]->（實體） (ch17)

**Unstructured** — 專業文檔處理庫。「先理解、後分割」：分區 (Partitioning) 產生帶語義標籤的元素，再分塊。分塊方法 `basic` 與 `by_title` (ch02, ch03)

**ViT (Vision Transformer)** — 實現跨模態對齊的關鍵技術突破之一 (ch16)

**Visualized_BGE** — 把圖像 token 嵌入整合到 BGE 文字嵌入框架的多模態模型。三種編碼模式：純文字、純圖像、圖文聯合 (ch16)

**Weaviate** — 支援 GraphQL 的 AI 整合向量資料庫，20+ AI 模組與多模態支援 (ch05)

**Word2Vec** — 靜態詞嵌入模型 (2013)，Skip-gram 與 CBOW 架構。無法處理一詞多義 (ch04)

**XLM-RoBERTa** — BGE-M3 的基礎架構。其 sentencepiece tokenizer 天然處理無詞邊界語言（CJK） (ch04, ch16)

**Zero-shot (零樣本)** — 無需針對特定任務微調即可泛化的能力。CLIP 把分類轉化為圖文檢索問題來實現 (ch16)
