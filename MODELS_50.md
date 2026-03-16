# Stone AI — Полный каталог 50 моделей

> Скопируй этот файл в корень проекта и скажи Claude Code:
> "Прочитай MODELS_50.md и добавь все 50 моделей в ai_router.py и token_billing.py"

## Формула

- Средневзвешенная: `weighted = input × 0.4 + output × 0.6`
- Наценка: гибкая x2.5-6 (дешёвые модели — выше, дорогие — ниже)
- Цель: max +30-50% разницы с ishushka

## Полный каталог

Формат: `model_id | openrouter_slug | OR_input | OR_output | OR_weighted | multiplier | stone_weighted | tier | category | company | name | context`

---

### TIER 1: LITE (бесплатно 10+5/день, 5 моделей)

```
1.  gpt-4o-mini          | openai/gpt-4o-mini              | $0.15  | $0.60  | $0.42  | x6   | $2.50   | lite    | chat   | OpenAI    | GPT-4o mini        | 128K
2.  claude-haiku-4.5     | anthropic/claude-haiku-4.5       | $1.00  | $5.00  | $3.40  | x3.2 | $11.00  | lite    | chat   | Anthropic | Claude Haiku 4.5   | 200K
3.  gemini-2.0-flash     | google/gemini-2.0-flash          | $0.10  | $0.40  | $0.28  | x5   | $1.40   | lite    | chat   | Google    | Gemini 2.0 Flash   | 1M
4.  llama-4-maverick     | meta-llama/llama-4-maverick      | $0.20  | $0.60  | $0.44  | x4   | $1.76   | lite    | chat   | Meta      | Llama 4 Maverick   | 1M
5.  mistral-large-25     | mistralai/mistral-large-latest   | $2.00  | $6.00  | $4.40  | x4   | $17.60  | lite    | chat   | Mistral   | Mistral Large      | 128K
```

### TIER 2: СРЕДНИЕ (15 моделей)

```
6.  deepseek-r1           | deepseek/deepseek-r1             | $0.55  | $2.19  | $1.53  | x4   | $6.00   | premium | chat   | DeepSeek  | DeepSeek R1        | 164K
7.  deepseek-v3           | deepseek/deepseek-v3             | $0.25  | $0.38  | $0.33  | x4.5 | $1.50   | premium | chat   | DeepSeek  | DeepSeek V3        | 128K
8.  deepseek-v3.2         | deepseek/deepseek-v3.2           | $0.25  | $0.38  | $0.33  | x4.5 | $1.50   | premium | chat   | DeepSeek  | DeepSeek V3.2      | 128K
9.  gpt-4.1-mini          | openai/gpt-4.1-mini              | $0.40  | $1.60  | $1.12  | x4   | $4.50   | premium | chat   | OpenAI    | GPT-4.1 mini       | 1M
10. gpt-4.1-nano          | openai/gpt-4.1-nano              | $0.10  | $0.40  | $0.28  | x5   | $1.40   | premium | chat   | OpenAI    | GPT-4.1 nano       | 1M
11. gemini-2.5-flash      | google/gemini-2.5-flash          | $0.15  | $0.60  | $0.42  | x4   | $1.68   | premium | chat   | Google    | Gemini 2.5 Flash   | 1M
12. claude-sonnet-4       | anthropic/claude-sonnet-4        | $3.00  | $15.00 | $10.20 | x3   | $30.00  | premium | chat   | Anthropic | Claude Sonnet 4    | 200K
13. claude-sonnet-4.5     | anthropic/claude-sonnet-4.5      | $3.00  | $15.00 | $10.20 | x3   | $30.00  | premium | chat   | Anthropic | Claude Sonnet 4.5  | 200K
14. grok-3-mini           | x-ai/grok-3-mini                 | $0.30  | $0.50  | $0.42  | x4   | $1.68   | premium | chat   | xAI       | Grok 3 mini        | 131K
15. qwen-3-235b           | qwen/qwen3-235b-a22b             | $0.20  | $1.00  | $0.68  | x3   | $2.00   | premium | chat   | Alibaba   | Qwen 3 235B        | 40K
16. qwen-qwq              | qwen/qwq-32b                     | $0.20  | $1.00  | $0.68  | x3   | $2.00   | premium | chat   | Alibaba   | Qwen QwQ 32B       | 131K
17. minimax-m2.5          | minimax/minimax-m2.5              | $0.30  | $1.10  | $0.78  | x3   | $2.34   | premium | chat   | MiniMax   | MiniMax M2.5       | 1M
18. glm-5                 | zhipu/glm-5                      | $0.30  | $2.55  | $1.65  | x3   | $4.95   | premium | chat   | Zhipu     | GLM-5              | 128K
19. command-r7             | cohere/command-r7b                | $0.04  | $0.04  | $0.04  | x6   | $0.24   | premium | chat   | Cohere    | Command R7         | 128K
20. mistral-small          | mistralai/mistral-small-creative  | $0.10  | $0.30  | $0.22  | x5   | $1.10   | premium | chat   | Mistral   | Mistral Small      | 32K
```

### TIER 3: PREMIUM (15 моделей)

```
21. claude-opus-4          | anthropic/claude-opus-4           | $15.00 | $75.00 | $51.00 | x2.5 | $130.00 | premium | chat   | Anthropic | Claude Opus 4      | 200K
22. claude-opus-4.5        | anthropic/claude-opus-4.5         | $5.00  | $25.00 | $17.00 | x3   | $51.00  | premium | chat   | Anthropic | Claude Opus 4.5    | 200K
23. gpt-4.1                | openai/gpt-4.1                   | $2.50  | $10.00 | $7.00  | x4   | $28.00  | premium | chat   | OpenAI    | GPT-4.1            | 1M
24. gpt-5.1                | openai/gpt-5.1                   | $1.75  | $14.00 | $9.10  | x2.8 | $26.00  | premium | chat   | OpenAI    | GPT-5.1            | 400K
25. gpt-5.4                | openai/gpt-5.4                   | $2.50  | $15.00 | $10.00 | x3   | $30.00  | premium | chat   | OpenAI    | GPT-5.4            | 1M
26. gemini-2.5-pro         | google/gemini-2.5-pro            | $1.25  | $10.00 | $6.50  | x4   | $26.00  | premium | chat   | Google    | Gemini 2.5 Pro     | 1M
27. gemini-3-pro           | google/gemini-3-pro-preview      | $2.00  | $12.00 | $8.00  | x3   | $24.00  | premium | chat   | Google    | Gemini 3 Pro       | 1M
28. grok-3                 | x-ai/grok-3                      | $3.00  | $15.00 | $10.20 | x3.5 | $36.00  | premium | chat   | xAI       | Grok 3             | 131K
29. perplexity-sonar-pro   | perplexity/sonar-pro             | $3.00  | $15.00 | $10.20 | x2.5 | $26.00  | premium | search | Perplexity| Perplexity Pro     | 200K
30. kimi-k2.5              | moonshot/kimi-k2.5               | $0.20  | $1.50  | $0.98  | x4   | $3.92   | premium | chat   | Moonshot  | Kimi K2.5          | 128K
31. o4-mini                | openai/o4-mini                   | $1.10  | $4.40  | $3.08  | x4   | $12.32  | premium | reason | OpenAI    | o4-mini            | 200K
32. o3                     | openai/o3                        | $2.00  | $8.00  | $5.60  | x3.5 | $19.60  | premium | reason | OpenAI    | o3                 | 200K
33. claude-haiku-4.5-think | anthropic/claude-haiku-4.5:thinking | $1.00 | $5.00 | $3.40 | x3.5 | $11.90 | premium | reason | Anthropic | Claude Haiku Think | 200K
34. gemini-2.5-flash-think | google/gemini-2.5-flash:thinking | $0.15  | $3.50  | $2.16  | x4   | $8.64   | premium | reason | Google    | Gemini Flash Think | 1M
35. devstral               | mistralai/devstral               | $0.15  | $0.60  | $0.42  | x5   | $2.10   | premium | code   | Mistral   | Devstral           | 128K
```

### TIER 4: ГЕНЕРАЦИЯ И РЕДАКТИРОВАНИЕ ИЗОБРАЖЕНИЙ (8 моделей)

```
36. nano-banana-pro        | google/gemini-3-pro-image-preview | $2.00  | $12.00 | $8.00  | x4   | $32.00  | premium | image  | Google    | Nano Banana Pro    | 65K
37. nano-banana            | google/gemini-2.5-flash-preview:image | $0.15 | $0.60 | $0.42 | x4  | $1.68   | premium | image  | Google    | Nano Banana        | 1M
38. gpt-5-image            | openai/gpt-5-image               | $2.50  | $15.00 | $10.00 | x3   | $30.00  | premium | image  | OpenAI    | GPT-5 Image        | 128K
39. gpt-5-image-mini       | openai/gpt-5-image-mini          | $0.60  | $2.40  | $1.68  | x4   | $6.72   | premium | image  | OpenAI    | GPT-5 Image Mini   | 128K
40. flux-schnell           | black-forest-labs/flux-schnell    | —      | —      | —      | —    | $0.012/img | premium | image | BFL     | Flux Schnell       | —
41. stable-diffusion-xl    | stabilityai/sdxl                 | —      | —      | —      | —    | $0.04/img  | premium | image | Stability | SDXL              | —
```

### TIER 5: БЕСПЛАТНЫЕ НА OPENROUTER (7 моделей — Stone AI берёт фикс $1-2)

```
42. gemma-3-27b            | google/gemma-3-27b-it            | free   | free   | $0     | —    | $1.20   | premium | chat   | Google    | Gemma 3 27B        | 96K
43. gemma-3n-4b            | google/gemma-3n-e4b              | free   | free   | $0     | —    | $0.50   | premium | chat   | Google    | Gemma 3n 4B        | 32K
44. phi-4                  | microsoft/phi-4                  | free   | free   | $0     | —    | $1.20   | premium | chat   | Microsoft | Phi-4              | 16K
45. llama-3.3-70b          | meta-llama/llama-3.3-70b         | free   | free   | $0     | —    | $1.20   | premium | chat   | Meta      | Llama 3.3 70B      | 128K
46. qwen-turbo             | qwen/qwen-turbo                 | free   | free   | $0     | —    | $0.65   | premium | chat   | Alibaba   | Qwen Turbo         | 1M
47. nvidia-nemotron        | nvidia/llama-3.1-nemotron-70b    | free   | free   | $0     | —    | $1.00   | premium | chat   | NVIDIA    | Nemotron 70B       | 128K
48. mythomax-13b           | gryphe/mythomax-l2-13b           | free   | free   | $0     | —    | $0.50   | premium | chat   | Gryphe    | MythoMax 13B       | 4K
```

### TIER 6: СПЕЦИАЛЬНЫЕ (2 модели)

```
49. perplexity-sonar       | perplexity/sonar                 | $1.00  | $1.00  | $1.00  | x4   | $4.00   | premium | search | Perplexity| Perplexity Sonar   | 127K
50. perplexity-sonar-deep  | perplexity/sonar-deep-research   | $2.00  | $8.00  | $5.60  | x3   | $16.80  | premium | search | Perplexity| Sonar Deep Research| 127K
```

---

## Сводная таблица для фронтенда (50 моделей)

| # | Отображаемое имя | Компания | Тир | Категория | Stone AI $/1M | Контекст |
|---|-----------------|----------|-----|-----------|--------------|---------|
| 1 | GPT-4o mini | OpenAI | FREE | chat | $2.50 | 128K |
| 2 | Claude Haiku 4.5 | Anthropic | FREE | chat | $11.00 | 200K |
| 3 | Gemini 2.0 Flash | Google | FREE | chat | $1.40 | 1M |
| 4 | Llama 4 Maverick | Meta | FREE | chat | $1.76 | 1M |
| 5 | Mistral Large | Mistral | FREE | chat | $17.60 | 128K |
| 6 | DeepSeek R1 | DeepSeek | PRO | chat | $6.00 | 164K |
| 7 | DeepSeek V3 | DeepSeek | PRO | chat | $1.50 | 128K |
| 8 | DeepSeek V3.2 | DeepSeek | PRO | chat | $1.50 | 128K |
| 9 | GPT-4.1 mini | OpenAI | PRO | chat | $4.50 | 1M |
| 10 | GPT-4.1 nano | OpenAI | PRO | chat | $1.40 | 1M |
| 11 | Gemini 2.5 Flash | Google | PRO | chat | $1.68 | 1M |
| 12 | Claude Sonnet 4 | Anthropic | PRO | chat | $30.00 | 200K |
| 13 | Claude Sonnet 4.5 | Anthropic | PRO | chat | $30.00 | 200K |
| 14 | Grok 3 mini | xAI | PRO | chat | $1.68 | 131K |
| 15 | Qwen 3 235B | Alibaba | PRO | chat | $2.00 | 40K |
| 16 | Qwen QwQ 32B | Alibaba | PRO | chat | $2.00 | 131K |
| 17 | MiniMax M2.5 | MiniMax | PRO | chat | $2.34 | 1M |
| 18 | GLM-5 | Zhipu | PRO | chat | $4.95 | 128K |
| 19 | Command R7 | Cohere | PRO | chat | $0.24 | 128K |
| 20 | Mistral Small | Mistral | PRO | chat | $1.10 | 32K |
| 21 | Claude Opus 4 | Anthropic | PRO | chat | $130.00 | 200K |
| 22 | Claude Opus 4.5 | Anthropic | PRO | chat | $51.00 | 200K |
| 23 | GPT-4.1 | OpenAI | PRO | chat | $28.00 | 1M |
| 24 | GPT-5.1 | OpenAI | PRO | chat | $26.00 | 400K |
| 25 | GPT-5.4 | OpenAI | PRO | chat | $30.00 | 1M |
| 26 | Gemini 2.5 Pro | Google | PRO | chat | $26.00 | 1M |
| 27 | Gemini 3 Pro | Google | PRO | chat | $24.00 | 1M |
| 28 | Grok 3 | xAI | PRO | chat | $36.00 | 131K |
| 29 | Perplexity Pro | Perplexity | PRO | search | $26.00 | 200K |
| 30 | Kimi K2.5 | Moonshot | PRO | chat | $3.92 | 128K |
| 31 | o4-mini | OpenAI | PRO | reason | $12.32 | 200K |
| 32 | o3 | OpenAI | PRO | reason | $19.60 | 200K |
| 33 | Claude Haiku Think | Anthropic | PRO | reason | $11.90 | 200K |
| 34 | Gemini Flash Think | Google | PRO | reason | $8.64 | 1M |
| 35 | Devstral | Mistral | PRO | code | $2.10 | 128K |
| 36 | Nano Banana Pro | Google | PRO | image | $32.00 | 65K |
| 37 | Nano Banana | Google | PRO | image | $1.68 | 1M |
| 38 | GPT-5 Image | OpenAI | PRO | image | $30.00 | 128K |
| 39 | GPT-5 Image Mini | OpenAI | PRO | image | $6.72 | 128K |
| 40 | Flux Schnell | BFL | PRO | image | $0.012/img | — |
| 41 | SDXL | Stability | PRO | image | $0.04/img | — |
| 42 | Gemma 3 27B | Google | PRO | chat | $1.20 | 96K |
| 43 | Gemma 3n 4B | Google | PRO | chat | $0.50 | 32K |
| 44 | Phi-4 | Microsoft | PRO | chat | $1.20 | 16K |
| 45 | Llama 3.3 70B | Meta | PRO | chat | $1.20 | 128K |
| 46 | Qwen Turbo | Alibaba | PRO | chat | $0.65 | 1M |
| 47 | Nemotron 70B | NVIDIA | PRO | chat | $1.00 | 128K |
| 48 | MythoMax 13B | Gryphe | PRO | chat | $0.50 | 4K |
| 49 | Perplexity Sonar | Perplexity | PRO | search | $4.00 | 127K |
| 50 | Perplexity Deep Research | Perplexity | PRO | search | $16.80 | 127K |

---

## Категории для фильтров на фронтенде

- **chat** (35 моделей) — основной чат
- **image** (6 моделей) — генерация и редактирование изображений
- **reason** (4 модели) — reasoning (думающие модели)
- **search** (3 модели) — поиск в интернете
- **code** (2 модели) — специализированные для кода

## Компании для фильтров

OpenAI (10) · Anthropic (7) · Google (8) · DeepSeek (3) · Meta (2) · xAI (2) · Mistral (3) · Alibaba (3) · Perplexity (3) · MiniMax (1) · Zhipu (1) · Moonshot (1) · Cohere (1) · Microsoft (1) · NVIDIA (1) · BFL (1) · Stability (1) · Gryphe (1)
