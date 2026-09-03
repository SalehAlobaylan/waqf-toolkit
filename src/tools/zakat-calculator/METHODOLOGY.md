# Calculation Methodology — Zakat Calculator (Monetary Assets)

> Per `CONTRIBUTING.md`, changes to religious calculations require domain-knowledgeable review in addition to code review. This document must be complete before the PR is merged.

---

## 1. What is calculated

An itemized worksheet for **personal monetary assets** producing:
- total zakatable assets (sum of included lines)
- short-term liabilities deducted (capped)
- zakatable base = max(0, assets − liabilities)
- nisab threshold value for selected basis (`85g gold` or `595g silver` or both, using user-supplied prices)
- comparison `base ≥ nisab?` and 2.5% (`1/40`) estimate `zakatDue`

The tool covers only monetary assets entered manually at a single valuation date. It is an **estimate under a stated methodology**, not a fatwa; users must verify with a qualified scholar.

## 2. Inputs and their sources

| Input | Source | Validation |
|---|---|---|
| Currency | Select from `SUPPORTED_CURRENCIES` (12 ISO codes) — default `SAR` | Must be in allowlist; determines decimal places via `CURRENCY_DECIMALS` |
| Valuation date | Date picker `YYYY-MM-DD` (default today) | ISO date, `YYYY-MM-DD` valid calendar date |
| Cash & bank | Text `inputMode=decimal` | `≥0`, decimal string; empty = 0; invalid → `invalid-input` |
| Gold weight (g) | Text decimal + purity select `24/22/21/18` | `≥0`, purity factor via `PURITY_TABLE` (`24=1,22=0.9166,21=0.875,18=0.75`) |
| Silver weight (g) | Text decimal + purity select | Same |
| Gold price / g | Text decimal | `>0` required if `goldWeight>0` or `nisabBasis` is gold/both; else `price-required` |
| Silver price / g | Text decimal | `>0` required if `silverWeight>0` or `nisabBasis` is silver/both |
| Investments (readily realizable) | Text decimal | `≥0` |
| Receivables (expected) | Text decimal | `≥0`; help text: only strong, expected debts |
| Short-term liabilities | Text decimal | `≥0`; deducted capped at assets (`base = max(0, assets − liabilities)`) |
| Nisab basis | Radio `gold` (default) / `silver` / `both` — required | No silent single-basis hidden; `invalid-nisab-basis` if missing |
| Hawl confirmed | Checkbox `I confirm assets held one lunar year` | Boolean; if false status `hawl-not-confirmed`, estimate shown as preliminary |

No network fetch; all values stay in React state. If “Save on this device” is enabled, values are persisted to `localStorage` under `waqf-zakat-draft` — disclosed before input, with `Clear draft` control. Otherwise values stay in memory only.

## 3. Algorithm and conventions

**Decimal handling:** `decimal.js` with `precision 28, ROUND_HALF_UP`. Inputs are parsed as `new Decimal(string)` (never `parseFloat` → float). All arithmetic is `Decimal`; formatting only at UI boundary via `toFixed(decimals)`.

**Purity:** `pureGrams = weight × (karat/24)` using factor from `PURITY_TABLE`. Values kept full precision.

**Metal value:** `goldValue = pureGoldGrams × goldPricePerGram`, same for silver.

**Total assets:** `cash + goldValue + silverValue + investments + receivables` (all `Decimal`).

**Liabilities:** `liabilitiesDeducted = min(liabilities, totalAssets)`, `base = total - deducted` (never negative).

**Nisab:**
- Gold nisab weight 85g pure, silver 595g pure (AAOIFI Standard 35: 20 mithqal / 200 dirham, classical weights — cited, versioned).
- `nisabGoldValue = 85 × goldPrice`, `nisabSilverValue = 595 × silverPrice`.
- Basis selection is configuration, not bug: `gold` uses 85g, `silver` uses 595g, `both` computes and shows both comparisons. Default displayed is **gold** (as agreed), but radio is visible and changeable; export retains choice.

**Comparison & rate:**
- Status `below-nisab` if `base < nisabValue` (using `Decimal.cmp`); `liable` if `base ≥ nisab` (inclusive). For `both`, liable if `base ≥ silverValue` OR `base ≥ goldValue` (silver is lower → more liable; shown side-by-side).
- If `hawlConfirmed` is false, status is `hawl-not-confirmed` regardless; worksheet still computed but flagged preliminary.
- Rate `2.5% = 1/40 = 0.025` exact string. No lunar/solar rate adjustment (solar 2.575% is out of scope and would be a hidden fiqh choice). Documented: rate assumes lunar hawl as confirmed by checkbox.
- `zakatDue = base × 0.025` rounded `HALF_UP` to currency decimals (`SAR 2, KWD 3, IDR 0`). Only final `zakatDue` is rounded; intermediates are not.

**If two authorities could disagree, it is here:** nisab basis, 85/595 weights, purity factors, liability eligibility, hawl handling, investment/receivable inclusion, rounding — all are versioned in `constants.ts` and shown in UI, not hidden.

## 4. Data sources

| Dataset | Origin | Version/date | License | Why trusted |
|---|---|---|---|---|
| Nisab weights 85g gold / 595g silver | AAOIFI Shari'ah Standard No. 35 (20 mithqal / 200 dirham) + classical fiqh | `1.0.0` | Public facts, AAOIFI publication | Candidate baseline per roadmap; not an automatic fatwa — applicability to retail reviewed; weights versioned in `constants.ts` |
| Purity factors 24/22/21/18 | Industry standard `karat/24` (22=0.9166...) | `1.0.0` | Public facts | Scholar-approved factor table, versioned |
| Rate 2.5% (1/40) | Classical consensus for monetary zakat, AAOIFI 35 | `1.0.0` | Public | Exact decimal string, no float |
| Currency decimals | ISO 4217 minor units (SAR 2, KWD 3, IDR 0) | `1.0.0` | Public | `CURRENCY_DECIMALS` table |

No external price feed; prices are manual to keep `processing: 'browser'` and avoid silent market-data dependency.

## 5. Known limitations

- Monetary assets only. Agricultural produce, livestock, minerals, business inventory, pensions, trusts, jointly owned property, multiple currencies with FX, and jurisdiction-specific tax are **out of scope** — tool refuses to calculate them and shows a “What we don’t calculate” box.
- Personal-jewelry fiqh split: tool includes all gold/silver entered; note instructs users whose scholar exempts personal-use jewelry to exclude it manually. No automatic exemption.
- Investments: user must enter readily realizable market value as of valuation date; illiquid/private holdings are excluded.
- Receivables: include only strong, expected debts; doubtful debts should be excluded manually.
- Liabilities: only short-term deductible as entered; capped. Not a full balance-sheet.
- Single currency, no FX. If assets span currencies, user must convert externally and enter total in one currency.
- Hawl is a **checkbox confirmation**, not a computed duration from transaction dates. Solar-year rate adjustment (2.575%) is not applied.
- Not a fatwa. Export and UI show disclaimer in both languages.

## 6. Review checklist (for reviewers)

- [ ] Methodology document is complete and specific
- [ ] Implementation matches the documented algorithm (`engine.ts`, `constants.ts`)
- [ ] Convention choices are visible in the UI (nisab radio, purity, currency, hawl checkbox, disclaimer), not hidden defaults
- [ ] Test cases cover known reference values (cite them in the tests)
- [ ] Domain-knowledgeable reviewer has signed off

## 7. Reference values used in tests

| Input | Expected output | Source of truth |
|---|---|---|
| SAR cash 10000, nisab gold 21250 (250/g) | below-nisab, zakat 0 | Threshold test: 85×250=21250 > 10000 |
| SAR cash 21250, gold nisab | liable, zakat 531.25 | At nisab inclusive |
| SAR cash 0.10 + gold 0.20 price 1 | total 0.30 no float drift | Decimal 0.10+0.20 invariant |
| Gold 100g 22k @250/g | pure 91.666..., value 22916.67 | Purity factor 0.9166 |
| Gold 10g but goldPrice empty | price-required | Validation |
| Liabilities 5000 > assets 3000 | base 0, below-nisab | Cap test |
| Hawl false, base above nisab | hawl-not-confirmed, zakat 0 (preliminary) | Hawl flag |
| KWD currency, cash 1000 | zakat 25.000 (3 decimals) | Currency decimals |
| IDR 0 decimals, cash 1000 | zakat 25 | Zero-decimal currency |
| Both bases: gold 21250, silver 1785 (3/g) → cash 5000 | liable via silver, not gold | Both comparison |

