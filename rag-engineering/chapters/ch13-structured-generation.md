# Chapter 13: 格式化生成 — Output Parsers 與 Function Calling

## Core Idea
從 LLM 拿到一段非結構化文字，在應用中常常不夠用。格式化生成是**連接 LLM 的自然語言理解能力與下游應用程式化邏輯之間的關鍵**。Function Calling 相對提示工程的優勢不只是格式更穩，而是它還包含了「意圖到函數的映射」。

## Frameworks Introduced

- **三種格式化生成方案**（可靠性由低到高）：

| 方案 | 機制 | 可靠性 | 適用 |
|---|---|---|---|
| **純提示工程** | 在提示中要求 JSON 格式 | 低（格式可能不穩） | 不想依賴框架時 |
| **Output Parsers** | 注入格式指令 + 解析驗證 | 中 | LangChain/LlamaIndex 生態 |
| **Function Calling** | 模型**原生**支援 | **高** | 需要與外部工具互動時 |

- **`PydanticOutputParser` 的四步工作流**（LangChain）：
  1. **定義資料模型** — 用 Pydantic `BaseModel` 定義類別。**`Field` 中的 `description` 文字會直接作為指令提供給大模型，因此表述需清晰準確。**
  2. **生成格式指令** — `get_format_instructions()` 調用 `.model_json_schema()` 提取 JSON Schema，簡化後嵌入預設的指導性提示模板
  3. **建構並執行調用鏈** — 透過 LCEL 串接 `prompt | llm | parser`。`prompt` 把使用者輸入與格式指令組合成最終提示
  4. **解析與驗證** — 兩步解析：先繼承自 `JsonOutputParser` 把字串解析成 Python 字典；再用 `PersonInfo.model_validate()` 驗證。**驗證失敗會拋出 `OutputParserException`**

- **Function Calling 的六步流程**：
  1. **定義工具** — 以 JSON Schema 定義可用工具：名稱 (`name`)、功能描述 (`description`)、參數 (`parameters`)。**這個描述的品質直接決定模型能否正確選擇和使用工具。**
  2. **使用者提問** — 發起需要調用工具才能回答的請求
  3. **模型決策** — 模型分析意圖並匹配最合適的工具。**它不會直接回答，而是回傳一個包含 `tool_calls` 的特殊響應**，相當於指令：「請調用某某工具，並使用這些參數」
  4. **程式碼執行** — 應用解析出工具名稱與參數，在程式碼層面**實際執行**（如調用真實的天氣 API）
  5. **結果回饋** — 把執行結果包裝成 `role` 為 `tool` 的訊息，再次發送給模型
  6. **最終生成** — 模型結合原始問題與工具回傳的資訊，生成最終的自然語言回答

- **LlamaIndex 的兩個相關組件**：
  - **響應合成 (Response Synthesis)** — 檢索器召回文本塊後，`Response Synthesizer` 以更智慧的方式呈現給 LLM。模式包括 `refine`（逐塊處理並迭代優化答案）與 `compact`（把盡可能多的塊壓進單次 LLM 調用）
  - **Pydantic Programs** — 結構化輸出。**若底層 LLM 支援 Function Calling，LlamaIndex 會優先使用它**以獲得更可靠的結構化輸出；不支援則回退到把 JSON Schema 注入提示詞

## Key Concepts
- **`tool_calls`** — 模型決定使用工具時回傳的特殊響應欄位。
- **GBNF (GGML BNF)** — 語法約束檔案。對本地部署的開源模型（如透過 `llama.cpp` 執行），可強制約束模型輸出的**每一個 token** 都嚴格符合預定義的 JSON 語法。**這是最嚴格也最可靠的非 Function Calling 方法。**
- **`StrOutputParser` / `JsonOutputParser` / `PydanticOutputParser`** — LangChain 的三級解析器，嚴格程度遞增。

## Mental Models
- **Function Calling ≠ 只是格式化輸出**：它包含「意圖到函數的映射」——模型能根據問題**主動選擇**最合適的工具。這是它與提示工程要求 JSON 的本質差異。
- **Schema 的 description 就是提示詞**：Pydantic `Field` 的 `description` 與工具定義的 `description` 都會直接進入模型的上下文。它們的品質決定了輸出品質。
- **可靠性梯度對應控制點的位置**：提示工程在**輸入端**要求；Output Parser 在**輸出端**驗證；Function Calling 在**模型內部**；GBNF 在**解碼器層級**。越靠近生成過程，越可靠。
- **Function Calling 是 Agent 的基礎**：它讓 LLM 可以查詢資料庫、調用 API、控制智慧家居——是建構能執行實際任務的 AI 代理的核心。

## Anti-patterns
- **在 `Field(description=...)` 裡寫模糊描述**：這段文字直接餵給模型，模糊描述 = 模糊輸出。
- **只靠提示詞要求 JSON 就不做驗證**：純文字輸出格式可能不穩，必須有解析失敗的處理路徑。
- **對支援 Function Calling 的模型還用提示工程硬要 JSON**：原生能力更穩定精確。
- **忽略 GBNF 這類解碼層約束**：對本地開源模型，這是比任何提示技巧都可靠的方法。

## Reference Tables

### 不依賴框架的四個實用技巧
| 技巧 | 做法 |
|---|---|
| **明確要求 JSON 格式** | 直接、強硬地要求「必須回傳一個 JSON 物件」「不要包含任何解釋性文字，只回傳 JSON」 |
| **提供 JSON Schema** | 在提示中給出想要的 JSON 模式，描述每個鍵的含義與資料型別 |
| **提供 few-shot 示例** | 給出 1–2 個「使用者輸入 → 期望的 JSON 輸出」完整示例 |
| **使用語法約束** | 對本地模型用 **GBNF** 強制約束每個 token 符合 JSON 語法 |

### Function Calling 的三大優勢
| 優勢 | 說明 |
|---|---|
| **可靠性更高** | 模型原生支援，相比解析格式不穩的純文字輸出，結構化資料更穩定精確 |
| **意圖識別** | 不只是格式化輸出，更包含「**意圖到函數的映射**」——模型能主動選擇最合適的工具 |
| **與外部世界互動** | 建構能執行實際任務的 AI Agent 的核心基礎 |

## Worked Example
**RAG 系統中格式化生成的三個典型場景**（書中列舉）：

1. **RAG 驅動的電商客服**
   - 使用者問：「推薦幾款適合程式設計師的鍵盤」
   - 期望輸出：**包含產品名稱、價格、特性和購買連結的 JSON 列表**，而非一段描述性文字
   - 理由：前端可直接渲染成商品卡片

2. **自然語言轉 API 調用**
   - 使用者說：「幫我查一下明天從上海到北京的航班」
   - 期望輸出：`{"departure": "上海", "destination": "北京", "date": "2025-07-18"}`
   - 理由：系統需要結構化的 API 請求

3. **資料自動提取**
   - 輸入：一篇新聞文章
   - 期望輸出：自動抽取事件、時間、地點、涉及人物等關鍵資訊
   - 理由：以結構化形式存入資料庫

**三個場景的共同點**：LLM 的輸出**不是給人看的，是給程式吃的**。這就是格式化生成存在的全部理由——它是自然語言理解與程式化邏輯之間的接口。

**方案選擇**：
- 場景 2（航班查詢）**應該用 Function Calling** — 它不只要格式化，還要決定「調用哪個 API」，這正是意圖到函數的映射
- 場景 1、3 用 `PydanticOutputParser` 即可 — 只需要格式化，不需要選工具

## Key Takeaways
1. 格式化生成是**連接 LLM 自然語言理解與下游程式化邏輯的關鍵**——輸出是給程式吃的，不是給人看的。
2. **可靠性梯度**：提示工程 < Output Parsers < Function Calling < GBNF 語法約束。越靠近生成過程越可靠。
3. **`Field(description=...)` 的文字會直接成為給模型的指令**——表述必須清晰準確。
4. **`PydanticOutputParser` 兩步解析**：先解析成字典，再用 `model_validate()` 驗證。失敗拋 `OutputParserException`。
5. **Function Calling 的核心價值是「意圖到函數的映射」**，不只是格式穩定。它是 AI Agent 的基礎。
6. **LlamaIndex 的 Pydantic Programs 會優先使用 Function Calling**（若模型支援），否則回退到注入 JSON Schema。
7. 對本地開源模型，**GBNF 是最可靠的非 Function Calling 方法**——在解碼器層級強制每個 token 符合語法。

## Connects To
- **ch10 查詢翻譯**：「讓 LLM 生成 JSON 排序指令」正是格式化生成在檢索前端的應用。
- **ch12 查詢建構**：Text-to-SQL / Text-to-Cypher 的輸出也需要結構化與驗證。
- **ch14 評估**：LLM-as-judge 的評分輸出同樣需要格式化，才能程式化聚合。
- **ch11 查詢路由**：LLM 意圖識別輸出分類標籤，是格式化生成的最簡形式。
