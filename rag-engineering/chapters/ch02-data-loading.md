# Chapter 2: 資料載入 — 垃圾進，垃圾出

## Core Idea
資料載入是整個管線的第一步，也是**最容易被輕視的一步**。書中的原話：**「垃圾進，垃圾出 (Garbage In, Garbage Out)」——高品質輸入是高品質輸出的前提**。載入品質直接影響索引建構、檢索效果與最終生成品質。

## Frameworks Introduced

- **文檔載入器的三大職責**：
  1. **文檔格式解析** — 把不同格式（PDF、Word、Markdown、HTML）解析為文字內容
  2. **元資料提取** — 解析內容的同時，提取來源、頁碼等元資料
  3. **統一資料格式** — 轉換為統一格式便於後續處理

- **Unstructured 的「先理解、後分割」策略**：
  - When to use: 版式複雜的文件，或需要保留原始語義結構時。
  - How: 兩階段：
    1. **分區 (Partitioning)** — 把原始文件解析成一系列**帶語義標籤的「元素」(Elements)**，如 `Title`、`NarrativeText`、`ListItem`。**這個過程本身就完成了對文件的深度理解與結構化。**
    2. **分塊 (Chunking)** — 建立在分區結果之上，**輸入是「元素」列表而非純文字**，進行智慧組合（見 ch03）。
  - Why it works: 在最大程度上保留文件的原始語義結構，處理版式複雜的文件時優勢尤為明顯。

- **`partition()` 的關鍵參數**：

| 參數 | 用途 |
|---|---|
| `filename` | 文件路徑 |
| `content_type` | 指定 MIME 型別（如 `"application/pdf"`），**可繞過自動檔案型別偵測** |
| `file` | 檔案物件，與 `filename` 二選一 |
| `url` | 遠端文件 URL，支援直接處理網路文件 |
| `include_page_breaks` | 是否在輸出中包含頁面分隔符 |
| `strategy` | 處理策略：`"auto"` / `"fast"` / `"hi_res"` |
| `encoding` | 文字編碼，預設自動偵測 |

  - **進階建議**：`partition()` 內部會依檔案型別路由到專用函數（PDF → `partition_pdf`）。**需要更專業的 PDF 處理時，直接使用 `from unstructured.partition.pdf import partition_pdf`**——它提供更多 PDF 特有參數（OCR 語言設定、圖像提取、表格結構推理），且**效能更優**。

## Key Concepts
- **Elements（元素）** — Unstructured 分區產生的帶語義標籤單位。
- **`CompositeElement`** — 分塊處理產生的特殊元素型別，由一個或多個連續文字元素組合而成（例如多個列表項可能被組合成一個塊）。
- **GIGO (Garbage In, Garbage Out)** — 本章的核心告誡。

## Mental Models
- **載入決定了後面所有環節的上限**：解析錯誤的表格、丟失的標題階層、亂碼的字元，在後續任何環節都補救不回來。
- **元素標籤是免費的結構資訊**：`Title` / `NarrativeText` / `ListItem` 這些標籤，正好是 ch03 結構化分塊與 ch06 結構化索引的原料。不用白不用。
- **選型沒有唯一答案**：書中明確說「由於各種文檔載入器的迭代更新，以及各類 AI 應用的不同需求，具體選擇需要根據實際情況」。應依文件類型實測。
- **驗證載入結果，不要假設它成功了**：解析出多少元素、哪些型別、總字元數——這些應該在建索引前就檢查。

## Anti-patterns
- **跳過載入品質驗證直接進分塊**：解析失敗常常是靜默的（如中文被丟棄、表格變成亂序碎片）。
- **對掃描版 PDF 用 `fast` 策略**：需要 OCR 時應用 `hi_res` 或 `ocr_only`。
- **用通用 `partition()` 處理需要精細控制的 PDF**：`partition_pdf` 有更多參數且效能更優。
- **忽略元素型別資訊**：把 Unstructured 的輸出直接 join 成純文字，等於丟掉了它最有價值的產出。

## Reference Tables

### 主流 RAG 文檔載入器
| 工具 | 特點 | 適用場景 | 效能表現 |
|---|---|---|---|
| **MinerU** | 多模態整合解析 | 學術文獻、財務報表 | 整合 LayoutLMv3 + YOLOv8 |
| **PyMuPDF4LLM** | PDF → Markdown 轉換，OCR + 表格識別 | 科研文獻、技術手冊 | 開源免費，GPU 加速 |
| **Unstructured** | 多格式文檔解析 | PDF、Word、HTML 等 | 統一介面，智慧解析 |
| **LlamaParse** | 深度 PDF 結構解析 | 法律合約、學術論文 | 解析精度高，**商業 API** |
| **Docling** | 模組化企業級解析 | 企業合約、報告 | IBM 生態相容 |
| **Marker** | PDF → Markdown，GPU 加速 | 科研文獻、書籍 | 專注 PDF 轉換 |
| **FireCrawlLoader** | 網頁內容抓取 | 線上文檔、新聞 | 即時內容獲取 |
| **TextLoader** | 基礎文字檔載入 | 純文字處理 | 輕量高效 |
| **DirectoryLoader** | 批次目錄檔案處理 | 混合格式文檔庫 | 支援多格式擴展 |

### Unstructured 支援的文檔元素型別
| 元素型別 | 描述 |
|---|---|
| `Title` | 文檔標題 |
| `NarrativeText` | 由多個完整句子組成的正文，**不包括**標題、頁眉、頁腳和說明文字 |
| `ListItem` | 列表項 |
| `Table` | 表格 |
| `Image` | 圖像元資料 |
| `Formula` | 公式 |
| `CodeSnippet` | 程式碼片段 |
| `FigureCaption` | 圖片標題／說明文字 |
| `Header` / `Footer` | 頁眉／頁腳 |
| `PageBreak` / `PageNumber` | 頁面分隔符／頁碼 |
| `Address` / `EmailAddress` | 物理地址／郵箱 |
| `UncategorizedText` | 未分類的自由文字 |
| `CompositeElement` | **分塊處理產生**的複合元素 |

## Worked Example
**驗證一次 PDF 載入是否成功**——本章方法論的實作。

載入後立即檢查三件事：

```python
from unstructured.partition.auto import partition
from collections import Counter

elements = partition(filename="report.pdf")

# 1. 元素數量與總字元數
print(f"解析完成: {len(elements)} 個元素, "
      f"{sum(len(str(e)) for e in elements)} 字元")

# 2. 元素型別分布
types = Counter(type(e).__name__ for e in elements)
print(f"元素型別: {dict(types)}")
```

**該看什麼**：
- **總字元數異常低** → 解析失敗。特別注意：CJK 內容若被靜默丟棄，字元數會遠低於預期，但程式不會報錯
- **只有 `UncategorizedText` 沒有 `Title`** → 結構識別失敗，後續無法做結構化分塊
- **預期有表格卻沒有 `Table` 元素** → 需要換 `strategy="hi_res"` 或改用 `partition_pdf` 開啟表格結構推理
- **`NarrativeText` 佔比極低** → 可能是掃描版，需要 OCR

**書中留的練習**：用 `partition_pdf` 替換 `partition`，分別用 `hi_res` 與 `ocr_only` 解析，觀察輸出差異。

**常見錯誤處理**：若出現 `ImportError: libgl.so.1 cannot open shared object file`，執行 `sudo apt-get install python3-opencv` 安裝依賴。

## Key Takeaways
1. **垃圾進，垃圾出** — 載入品質決定後面所有環節的上限，解析錯誤補救不回來。
2. **Unstructured 的「先理解、後分割」**：分區產生帶語義標籤的元素，分塊消費這些元素而非純文字。
3. **元素標籤（`Title`/`NarrativeText`/`ListItem`）是免費的結構資訊**，正好是結構化分塊與結構化索引的原料。
4. **需要精細 PDF 控制時直接用 `partition_pdf`**——更多參數（OCR 語言、圖像提取、表格結構推理）且效能更優。
5. **載入後必須驗證**：元素數量、字元總數、型別分布。CJK 被靜默丟棄是最陰險的失敗模式。
6. 載入器選型**沒有唯一答案**，依文件類型實測。學術文獻看 MinerU/PyMuPDF4LLM，法律合約看 LlamaParse，通用場景看 Unstructured。

## Connects To
- **ch03 分塊**：Unstructured 的分區結果直接餵給它的分塊功能；`by_title` 方法依賴 `Title` 元素。
- **ch06 索引優化**：元素標籤與頁碼等元資料，是結構化索引的原料。
- **ch16 多模態**：`Image` 與 `Table` 元素的處理需要多模態能力。
