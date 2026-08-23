---
name: academic-milp-modeling
description: Best practices for extracting academic data from PDFs and building robust MILP/Monte Carlo models using PuLP/Pandas.
---
# Academic MILP & Data Modeling

## 1. PDF Data Extraction (Sanity & Semantic Checks)
* **Cross-Page Blindspots:** PDF parsers (like `pdfplumber`) often break or miss tables that span across pages. Cross-validate with the text (e.g., search for "Table 3") to ensure all rows are captured.
* **Semantic Role Tagging (Input vs. Output):** Never confuse a "Baseline" (Business-as-Usual) table with an "Optimization Results" table. If an algorithm uses a result table as its input baseline, high-emission sectors might show `0.0` initial capacity, causing division-by-zero errors in $\Delta C\%$ calculations.
* **Sanity Checks:** If a major heavy industry (e.g., Steel, Cement) shows `0.0` baseline activity or emissions, halt and warn the user. This is physically impossible in a BAU scenario.

## 2. MILP Optimization (Tchebycheff / Min-Max Bottlenecks)
* **Pure Suppliers:** In a network where the objective minimizes the maximum deviation (`max(deviations)`), nodes that *only supply* (and never receive) will have 0% savings. This bottlenecks the entire Tchebycheff function. **Fix:** Use a boolean mask (`is_receiver_mask`) to exclude non-receivers from the max reduction penalty.
* **Physical Constraints:** Normalize ideal savings targets against the *maximum physical supply* the network can provide to a sector, rather than the sector's theoretical total demand.

## 3. Monte Carlo vs. Convergence Testing
* **Deterministic Convergence:** To prove solver stability, run the base scenario ~100 times with *zero noise*. The standard deviation of the outputs must be 0.0.
* **Monte Carlo Uncertainty:** Run 10,000+ iterations injecting stochastic noise (e.g., `np.random.uniform(0.9, 1.1)`) into the economic/emission baselines. Extract the Mean, 5th Percentile, and 95th Percentile to provide a 90% Confidence Interval.

## 4. Python/Pandas Formatting Gotchas
* **Memory Errors in Grid Search:** Never append millions of tensor combinations to a Python list. Prune continuously in batches (e.g., `top_k_df = pd.concat(...).sort_values().head(100000)`).
* **Excel CSV Encoding:** Always use `df.to_csv(..., encoding='utf-8-sig')` to prevent chemical symbols (like NH₃) from turning into gibberish in Excel.
* **Background Matplotlib:** When generating charts autonomously, use `plt.savefig()` followed immediately by `plt.close(fig)`. Do not use `plt.show()`, as it hangs background execution.
