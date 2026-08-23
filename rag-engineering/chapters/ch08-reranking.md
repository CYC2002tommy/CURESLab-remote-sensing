# Chapter 8: 重排序 — RRF / RankLLM / Cross-Encoder / ColBERT

## Core Idea
向量相似度檢索有個固有缺陷：**最相關的文件不總是排在最前面**。重排序在初步召回（如 top-50）之後、送進 LLM 之前插入一層更精細的相關性判斷。四種方法的差別在於**交互粒度**——查詢與文件在什麼層級上被比較。

## Frameworks Introduced

- **交互粒度 (Interaction granularity)** — 理解四種重排方法的統一框架。
  - When to use: 選擇重排方法時的核心判準。
  - How: 粒度越細，精度越高，成本越高：
    - **無交互**（RRF）— 只看排名，查詢與文件從未被一起計算
    - **概念/語義級**（RankLLM）— LLM 讀懂兩者含義後排序
    - **句子級**（Cross-Encoder）— Query 與 Doc 拼接成單一輸入聯合編碼
    - **Token 級**（ColBERT）— 每個 query token 對每個 doc token 求最大相似度

- **Cross-Encoder 重排**：精度最高的標準做法。
  - When to use: Top-K 精排，且能接受延遲。
  - How:
    1. 初步檢索召回文件列表（例如前 50 篇）
    2. 每篇文件與原始查詢**配對拼接**成單一輸入：`[CLS] query [SEP] document [SEP]`
    3. 送入預訓練 Transformer（如 BERT），輸出**單一分數**（通常 0–1）直接代表相關性
    4. 依新分數重新排序
  - Why it works: 查詢與文件在模型內部**同時被分析**，注意力可以跨越兩者。
  - Failure mode: 需要 **N 次獨立的模型推理**（N = 候選文件數）。這是高延遲的直接來源，且無法預先計算。
  - 常見模型：`ms-marco-MiniLM-L-12-v2`、`ms-marco-TinyBERT-L-2-v2`

- **ColBERT 後期交互 (Late Interaction)**：精度與效率的平衡點。
  - When to use: 需要接近 Cross-Encoder 的精度，但無法承受 N 次聯合編碼。
  - How:
    1. **獨立編碼**：分別為 Query 與 Document 的**每個 token** 生成上下文相關的嵌入向量。這一步是獨立的，**文件向量可預先計算並儲存**。
    2. **後期交互**：查詢時計算查詢中每個 token 的向量與文件中每個 token 向量的**最大相似度 (MaxSim)**。
    3. **分數聚合**：將查詢所有 token 得到的最大相似度分數**相加**，得到最終相關性總分。
  - Why it works: 避開了昂貴的聯合編碼，同時比只比較單一 `[CLS]` 向量的雙編碼器捕捉了**更細粒度的詞彙級交互**。
  - 實作要點：`similarity_matrix.max(dim=1).values` 實現 MaxSim，`.sum()` 完成聚合。

- **RankLLM / LLM-based Reranker**：直接讓 LLM 排序。
  - When to use: 高價值語義理解場景，且候選文件數不多。
  - How: 設計提示詞，包含使用者查詢與一系列候選文件（通常是摘要或關鍵部分），要求 LLM 以特定格式輸出排序後的文件列表與相關性分數。
  - 基本邏輯：既然 LLM 最終要根據上下文生成答案，何不直接讓它判斷哪些上下文最相關？

## Key Concepts
- **MaxSim** — ColBERT 的核心運算：為查詢中每個 token 向量，從文件所有 token 向量中找最相似的一個。
- **`[SEP]`** — BERT 類模型中用於分隔不同文本片段（查詢與文件）的特殊標記。
- **零樣本重排 (Zero-shot reranking)** — RRF 的特性：不依賴任何模型訓練。
- **BaseDocumentCompressor** — LangChain 中實現自訂重排器的核心基類。

## Mental Models
- **重排是「精排」不是「召回」**：它只能改善已召回文件的順序，**召不回來的東西重排救不了**。所以先修檢索（ch07），再談重排。
- **雙編碼器 → ColBERT → Cross-Encoder 是一條精度/成本的連續光譜**：雙編碼器只比 1 個向量、ColBERT 比 N×M 個 token、Cross-Encoder 直接聯合編碼。
- **可預先計算 = 可規模化**：ColBERT 的文件向量能預先算好存起來，Cross-Encoder 不行。這是兩者在生產環境的關鍵分野。
- **RRF 在本書出現兩次，用途不同**：在 ch07 是融合多路召回；在本章是零樣本重排。同一個公式，兩種定位。

## Anti-patterns
- **用重排掩蓋檢索的問題**：如果 top-50 裡根本沒有正確答案，重排只是把錯的排序換個順序。
- **對全庫做 Cross-Encoder**：N 次模型推理的成本隨候選數線性增長。重排的前提就是先有一個小的候選集。
- **忽略 LangChain 沒有內建 ColBERT 重排器**：需要自行繼承 `BaseDocumentCompressor` 實作。書中完整示範了這個「從官方文檔出發 → 發現需求缺口 → 分析源碼 → 定位核心基類 → 參考實作」的探索流程。

## Reference Tables

### 四種重排方法對比
> 此表依書中內文重建（原 PDF 表格抽取後欄位錯亂）。

| 特性 | RRF | RankLLM | Cross-Encoder | ColBERT |
|---|---|---|---|---|
| **核心機制** | 融合多個排名 | LLM 推理，生成排序列表 | 聯合編碼查詢與文件，計算單一相關分 | 獨立編碼，後期交互 |
| **計算成本** | 低（簡單數學計算） | 中（API 費用與延遲） | **高**（N 次模型推理） | 中（向量點積計算） |
| **交互粒度** | 無（僅排名） | 概念／語義級 | 句子級（Query-Doc Pair） | **Token 級** |
| **可預先計算文件向量** | 不適用 | 否 | **否** | **是** |
| **適用場景** | 多路召回結果融合 | 高價值語義理解場景 | Top-K 精排 | Top-K 重排 |

### 壓縮器 / 重排器管道組件（LangChain）
| 組件 | 類型 | 作用 |
|---|---|---|
| `ContextualCompressionRetriever` | 包裝器 | 包在基礎檢索器外，先檢索再交給 compressor 處理 |
| `DocumentCompressorPipeline` | 管道 | **依序**調用列表中的每個處理器，可組合「重排 → 壓縮」 |
| `BaseDocumentCompressor` | 基類 | 自訂重排器的切入點，實作 `compress_documents` |

## Worked Example
**組合「ColBERT 重排 + LLM 壓縮」管道**——書中的完整實作流程。

1. **建立基礎組件**：標準 FAISS 向量儲存 + `base_retriever`，負責初步召回 **20 篇**可能相關的文件。
2. **準備處理單元**：
   - `reranker`：自訂的 `ColBERTReranker` 實例
   - `compressor`：LangChain 內建的 `LLMChainExtractor`，從文件中提取與查詢相關的句子
3. **建構處理管道**：建立 `DocumentCompressorPipeline`，把 `reranker` 與 `compressor` **按順序**放入 `transformers` 列表。依其源碼，它會依次調用列表中每個處理器 → 文件先經 ColBERT 重排，重排後的結果再送入 LLM 壓縮。
4. **組裝最終檢索器**：用 `ContextualCompressionRetriever` 把 `base_retriever` 與 `pipeline_compressor` 包在一起。調用時自動執行「基礎檢索 → 管道處理（重排 → 壓縮）」的完整流程。

**自訂 ColBERTReranker 的內部**：
- 繼承 `BaseDocumentCompressor`，實作抽象方法 `compress_documents(documents, query)`
- `_colbert_score` 中，查詢與文件**分別獨立編碼**得到各自所有 token 的嵌入
- `similarity_matrix.max(dim=1).values` → 為查詢每個 token 找出文件中最相似的 token（MaxSim）
- `.sum()` → 聚合成該文件的最終分數
- 依分數由高到低重排，回傳排序後的列表

**書中留的練習**：這段管道程式碼的輸出會出現**重複**，思考為什麼並修正。（提示：檢查 pipeline 中兩個處理器對文件集合的處理是否產生了重疊輸出。）

## Key Takeaways
1. **交互粒度**是理解四種重排方法的統一框架：無交互 → 概念級 → 句子級 → Token 級，精度與成本同步上升。
2. **Cross-Encoder 精度最高但需要 N 次獨立推理**，且文件向量無法預先計算——這是它在生產環境的主要限制。
3. **ColBERT 用「後期交互」取得平衡**：獨立編碼（可預先算）+ MaxSim（細粒度）。
4. **RRF 是零樣本方法**，不需訓練，適合融合多路召回；它在本書中同時扮演融合器與重排器。
5. 重排只能改善**已召回**文件的順序。召回失敗時，重排無能為力。
6. LangChain 沒有內建 ColBERT，需繼承 `BaseDocumentCompressor` 自行實作；用 `DocumentCompressorPipeline` 可串接「重排 → 壓縮」。

## Connects To
- **ch07 混合檢索**：RRF 的定義與 c=60 在該章詳述；本章視其為重排方法的一種。
- **ch09 壓縮與校正**：重排之後的下一道工序，同屬「檢索進階」三段式（重排 → 壓縮 → 校正）。
- **ch04 向量嵌入**：ColBERT 的 token 級嵌入與一般句向量的差異，根源在池化方式。
- **ch14 評估**：重排的效果用 MRR / nDCG 這類排序敏感的指標衡量，而非單純的 Recall。
