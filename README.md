# Agent Desk · BSC 本地交易台 + Four.meme 抢购监控

一个**本地运行**的 BNB Chain（chainId 56）交易面板：聚合兑换 + 代币信息展示 + Four.meme 新币自动抢购监控。精致白 / 香槟金商业风格，三视图（兑换 · 抢购监控 · 记录）。

> **安全模型（最重要）**：面板**不持有私钥**。所有签名、授权、风控、广播都委托本机已登录的 **Binance Agentic Wallet CLI（`baw`）**。本项目只做只读查询和"发起交易请求"，密钥永远在钱包进程里。

![register](https://img.shields.io/badge/style-ivory%2Bgold-e0b24a) ![chain](https://img.shields.io/badge/chain-BSC%2056-f3ba2f) ![no--keys](https://img.shields.io/badge/keys-never%20stored-2e7d5e)

---

## 截图

| 兑换（自动识别平台路由） | 监控仪表盘 |
|---|---|
| ![兑换](docs/swap-route.png) | ![监控](docs/monitor.png) |
| **代币选择（常用币 + logo）** | **粘贴 CA 即展示代币信息** |
| ![选择代币](docs/token-picker.png) | ![搜索](docs/token-search.png) |

![记录](docs/activity.png)

> 截图中的钱包地址、余额和交易记录均为示例数据。

## 功能

- **U 计价显示**：支付和收到的数量后面都用括号标出约合多少 U（按实时 BNB/USDT 报价换算），最小到账和历史记录同样显示。
- **聚合兑换**：任意代币互换、USDT⇄BNB 快捷对、方向反转、滑点（自动/0.5/1/3/自定义）与 Gas（低/中/高）、防抖自动报价、价格影响、**25%/50%/75%/最大** 比例快捷填入、订单历史轮询到成交。
- **代币信息展示**：代币选择器里粘贴合约地址即展示该币 **logo / 名称 / 价格 / 市值 / 流动性 / 持有人 / 买卖税 / 貔貅·rug 风险徽章**（数据来自 GMGN），而不是裸"导入"。
- **Four.meme 抢购监控 + 自动买入**：事件驱动监听指定模板（preset）的新币上链，命中后自动用固定 BNB 预算走正确入口买入；**买不进（白名单/revert）自动跳过下一个，不烧 gas**；买到后桌面弹窗 + 面板事件；持仓涨到 10 倍弹窗提醒（只提醒不自动卖）。
- **监控仪表盘**：实时显示在线状态、实盘/模拟、盯的模板、预算、最新区块、已买/已跳计数、WSS 连接、心跳。

---

## 架构一图

```
浏览器 (panel.html + panel.js)
        │  fetch /quote /swap /meta /tokeninfo /orders /status /events ...
        ▼
ptah_panel.py  (Python stdlib HTTP, 127.0.0.1:8787)
        │  子进程调用
        ├── baw  (Binance Agentic Wallet CLI) ── 签名/授权/风控/广播（持私钥）
        ├── gmgn-cli (GMGN OpenAPI) ─────────── 行情/logo/税/风险
        └── token_meta.mjs / openfour_check.mjs ── 公共 RPC 只读

four_watch.mjs  (独立后台进程)
        ├── WSS newHeads 订阅 ─ 发现新币
        ├── eth_getLogs 过滤 TokenCreated[preset] ─ 精确命中目标模板
        ├── baw contract-call preview → execute ─ 能买才买
        └── 写 ~/.config/four-watch-{status,events}.json  ← 面板读
```

文件职责：

| 文件 | 作用 |
|---|---|
| `ptah_panel.py` | 本地 HTTP 服务器 + 全部端点，委托 baw/gmgn-cli/node 脚本 |
| `panel.html` / `panel.js` | 前端（三视图、blockies logo、搜索即展示、监控仪表盘） |
| `token_meta.mjs` | 任意代币的链上 name/symbol/decimals/balance + 钱包余额 |
| `openfour_check.mjs` | Four.meme V12 模板只读核查（注册/preset/NFT/能否买模拟） |
| `four_watch.mjs` | 抢购监控 + 自动买入 + 10 倍提醒 + 状态/事件落盘 |
| `AGENT钱包工作台prompt.txt` | 复刻用的完整提示词，丢给 AI 即可从零做出同款面板 |
| `stock_snipe.mjs` | 股票底池狙击：监控 four.meme Agent ID 模板新币，底池是 BNC4/NVDAB/BNCB/SPCXB/SKHYB 的立刻 BNB→股票币→曲线买入 |
| `routes.mjs` | 平台识别 + 曲线直调（AgentPad/Gang/MOAT/Flap Agent/UNITS）买卖适配 |

---

## 支持的平台（路由）

粘贴任意代币 CA，面板会自动识别它属于哪个平台，并选择路由（兑换卡标题旁的徽章显示结果）：

| 平台 | 识别方式 | 路由 | 说明 |
|---|---|---|---|
| four.meme 普通内盘 / 外盘 | 尾号 `4444` / `ffff` | Binance 聚合（baw） | |
| four.meme Agent 专属（OpenFour V12） | 在 OpenFourCore 登记的币 | 内盘曲线直调，毕业后走聚合 | `buyByBudget` 付 BNB / `sell`（卖出前按本次数量单独授权）；需 Agent ID NFT，测试阶段还要求模板白名单 |
| Flap（flap.sh） | 尾号 `7777` / `8888` | Binance 聚合（baw） | |
| 外盘（PancakeSwap） | 其余已上 DEX 的币 | Binance 聚合（baw） | |
| AgentPad（agentpad.trade） | 各 Factory `isToken(ca)` | 曲线直调 | `buyWithBNBMinOut` / `sellWithMin`，需 Agent ID |
| Gang（gang.fun） | Soft pad `curves(ca)` | 曲线直调 | `buy(token,minOut)` 付 BNB / `sell`，需 Agent ID，单钱包上限 1% |
| MOAT 曲线（moat.fun） | 曲线 pad `curves(ca)` | 曲线直调 | 同 Gang 接口 |
| Flap Agent 曲线（flap.sh） | Agent Factory `marketOfToken(ca)` | 曲线直调 | 买到的是曲线份额（非 ERC20），毕业后 claim；仅支持 BNB 计价市场 |
| UNITS（units-agentic.fun） | 精确匹配代币地址 | 曲线直调 | `buy` / `sell` |
| Cycpad（cycpad.fun） | 尾号 `cccc` + Factory `isToken(ca)` | 内盘曲线直调，毕业后走聚合 | `buyWithQuote(budget,minOut,deadline)` 付 BNB / `sell(amount,minOut,deadline)`，卖出不需要授权；买入需 Agent ID 或在该币买家白名单 |
| Gang Pair / Gang V2 | V2 pad `curves(ca)` | 暂不支持自动交易 | 以 ERC20（bStocks / GANG / WBNB）计价，需先换出报价代币并授权 |
| MOAT 占席（fair slot） | moat.fun board `mode=fair` | 暂未接入 | `fillSlot` 按席位定额付款，窗口期不可卖 |

**曲线直调的安全模型**：`routes.mjs` 只负责拼 calldata。每笔交易都先 `baw contract-call preview`（钱包后端模拟），通过后才 `execute`。卖出前的授权是单独一笔 `approve`，额度精确等于本次卖出数量，不做无限授权。滑点保护：买卖都按报价算 `minOut`，`auto` 滑点在曲线路由上默认 10%。

**直调交易的记录**：直调交易不经过 baw 的订单簿，面板在浏览器 localStorage 里另存一份，和 baw 订单合并显示在历史记录里，带平台标签和 Tx 链接。

新增平台：在 `routes.mjs` 的 `PLATFORMS` 加合约地址，在 `detect()` 加识别规则，在 `quote()` / `trade()` 加对应的报价和买卖调用即可（见下方 DIY 指南 B）。

## 股票底池狙击（stock_snipe.mjs）

只监控 four.meme 的「Binance Agent ID Exclusive」模板（`1778027615735`，需持 Agent ID NFT 才能交易）。每出一个新币，直接从 `TokenCreated` 事件里读它的底池代币；底池是下面这几种股票代币之一就立刻买入。模板可用 `SNIPE_PRESET` 改：

| 股票代币 | 合约 |
|---|---|
| BNC4 | `0x7c8d5502b544ddaf8852fc46d1174e34876d545c` |
| NVDAB | `0x02fca66c1d1afb4e2a7884261eb00f63598a7436` |
| BNCB | `0x4902c5ebc598265ed2212b559b042de8a5eeec3f` |
| SPCXB | `0xbe9d156892e55e7154bcd3cb0fea677f9d3103e1` |
| SKHYB | `0xca750ef65f295bbecd685abf54e82caf297bdb61` |

买入路径：先只读报价，确认曲线能买；然后用 baw 聚合把 BNB 换成对应股票代币，按实际到账数量单独授权给工厂合约，最后调 `buyByBudget` 在内盘买入。买满设定个数后停止。

```bash
# 先模拟（只报价不下单）
NODE_USE_ENV_PROXY=1 SNIPE_BUDGET_BNB=0.02 SNIPE_MAX=10 node stock_snipe.mjs
# 实盘
NODE_USE_ENV_PROXY=1 SNIPE_ARM=1 SNIPE_BUDGET_BNB=0.02 SNIPE_MAX=10 node stock_snipe.mjs
# 回放历史区块，检查识别和报价
NODE_USE_ENV_PROXY=1 node stock_snipe.mjs replay <fromBlock> <toBlock>
```

一笔要依次过 换币 → 授权 → 买入 三笔交易，从发现到买入成交大约十几秒，比纯 BNB 底池慢。

## 依赖与前置

- **macOS**（桌面通知用 `osascript`；Linux 改 `notify-send`）。
- **Python 3**（仅标准库）、**Node.js 18+**（ESM）。
- **`baw`** — Binance Agentic Wallet CLI，须已登录、已开 Developer Mode（`baw wallet settings --json` 看 `devMode.enabled`）。
- **`gmgn-cli`**（可选，代币信息/行情用）— GMGN OpenAPI CLI，key 放 `~/.config/gmgn/.env`：`GMGN_API_KEY=...`。
- Node 包：`ws`、`@noble/hashes`（`npm i`）。

---

## 快速开始

```bash
git clone https://github.com/gunksd/agenticwallet-desk.git && cd agenticwallet-desk
npm i                                   # ws + @noble/hashes

# 1) 起面板
NODE_USE_ENV_PROXY=1 python3 ptah_panel.py        # 打开 http://127.0.0.1:8787

# 2) 起监控 —— 先模拟（不真买），确认无误再切实盘
#    模拟：FOUR_ARM 不设
NODE_USE_ENV_PROXY=1 node four_watch.mjs
#    实盘：
GMGN_API_KEY=$(grep GMGN_API_KEY ~/.config/gmgn/.env|cut -d= -f2) \
NODE_USE_ENV_PROXY=1 FOUR_ARM=1 FOUR_BUDGET_BNB=0.01 node four_watch.mjs
```

> `NODE_USE_ENV_PROXY=1`：本机 Node fetch 需走本地代理时加上；不需要可省。

环境变量见 `.env.example`。常用：`FOUR_ARM`(1=实盘)、`FOUR_BUDGET_BNB`、`FOUR_PRESET`、`FOUR_LOGS_RPC`（自带高吞吐 getLogs 端点）。

---

## 端点速查（都在 127.0.0.1:8787）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/` `/panel.js` | 前端 |
| GET | `/health` | 存活 |
| GET | `/meta?tokens=a,b` | 钱包余额 + 代币链上元数据 |
| GET | `/tokeninfo?token=` | GMGN 行情/logo/税/风险 |
| GET | `/orders` · `/order?id=` | 订单历史 / 单条 |
| GET | `/route?token=` | 识别代币所属平台和路由 |
| GET | `/status` | 监控状态（面板仪表盘读） |
| GET | `/events` | 买入/10倍事件 |
| POST | `/quote` · `/swap` | 报价 / 下单（body: fromToken,toToken,qty,slippage,gasLevel） |
| POST | `/four/preflight` | 某代币只读核查（body: token） |

POST 都校验 Origin 和 Content-Type；token 参数用 `^0x[a-fA-F0-9]{40}$` 校验。

---

## Four.meme V12「Agent ID Exclusive」链上事实

（anvil fork + cast trace + 读字节码实证，2026-10 现网值，官方可能更新）

- **OpenFourCore** `0xebe7b6c1089d9f72ad07f34e36d898e44e5e27f3`。买入入口 `buyByBudget(address,uint256,uint256,uint256,bytes)`，选择器 `0x995ee6da`（不是 `buy`）。
- 模板 presetId **`1778027615735`**；注册表 OpenFourRegistry `0x912cef...`。
- `TokenCreated` 事件：topic0 `0x7dae4dcd...8f228f`，topic1=presetId，topic3=token。监听 `topics:[TC, pad(preset)]` 即只收该模板新币。
- OpenFourTools `0x97da82...` 的 estimate 实测费率 **买 2% / 卖 2%**。
- **两道准入叠加**：① 持 SPACE ID Agent ID NFT（`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`）≥1；② 模板白名单 `0x7b377Ad7...`（运营地址批量 `setWhitelisted`）。都满足才买，否则 revert `0xa2dda494`。
- **判据**：某钱包能否买某币，别猜——用 `baw contract-call preview` 跑只读模拟，激活/NFT/白名单全跑完，成功即真能买。监控以此为唯一买入判据，对官方改配置天然健壮。

---

## DIY 扩展指南（给想自己改的人 / 给 AI 改的 prompt）

下面每节都给"要做什么 + 改哪个文件 + 可直接丢给 AI 的 prompt"。

### A. 加一个新 HTTP 路由（后端）

**做什么**：在 `ptah_panel.py` 的 `Handler` 里加分支。GET 在 `do_GET`，POST 在 `do_POST`。
**模式**：解析参数 → 校验（地址用现成正则）→ 调 `run_baw([...])` 或 `run_node('xxx.mjs', arg)` 或 `gmgn_token_info(...)` → `self.send(result)`。失败统一 `{success:false,error:{message}}`。

> **Prompt**：「在 ptah_panel.py 的 do_GET 加一个 `/kline?token=&interval=` 路由，调用 `gmgn-cli market kline --chain bsc --address <token> --interval <interval> --raw` 并把结果透传为 `{success:true,data:...}`；token 用现有 ADDR 正则校验，复用 _gmgn_key() 和子进程超时兜底的写法。前端在 panel.js 的代币信息卡下面加一个迷你 K 线。」

### B. 加一个新的"台子"/新链 / 新 DEX 聚合源

**做什么**：兑换走的是 `baw market-order`，天然支持 baw 覆盖的链。要换链把 `ptah_panel.py` 的 `CHAIN="56"` 和 BNB/USDT 常量改掉，前端 PAIRS 和 header 文案同步。要接非 baw 的聚合器（如自建路由），新增一个 `swap_<venue>.mjs`，在 `/quote`、`/swap` 里按 body 里的 `venue` 字段分流。

> **Prompt**：「把兑换做成多台子：在 /quote 和 /swap 的 body 增加 venue 字段，venue='baw' 走现有 baw market-order，venue='myrouter' 调用新脚本 swap_myrouter.mjs（我会实现它，输入 fromToken/toToken/qty/slippage，输出同样的 {success,data:{toCoinAmount,toCoinSymbol}} / {orderId} 结构）。前端兑换卡加一个台子下拉选择，默认 baw。」

### C. 监控新的 Four.meme 模板 / 新 preset / 多模板同时盯

**做什么**：`four_watch.mjs` 的 `CFG.presetId` 决定盯哪个模板，靠 `FOUR_PRESET` 环境变量。换模板只需换号。要**同时盯多个模板**：把 `presetId` 改成数组，`eth_getLogs` 的 topic 过滤去掉 preset 这一维（只按 `TC_TOPIC` 收全部 TokenCreated），在 `handleTokens` 里读每个 token 的 preset 判断是否在白名单集合内。要盯**全新的台子**（不是 Four.meme）：把 `CFG.core`、`TC_TOPIC`、买入 calldata 构造换成新合约的，`tryBuy` 里的 preview 判据不变。

怎么找一个新模板的 presetId / TokenCreated topic：
1. 在区块浏览器找一笔该模板的建币或买入交易；
2. 看 OpenFourRegistry 的 `getPreset(id)` 名字确认；
3. TokenCreated 的 topic0 = `keccak256("TokenCreated(uint256,uint256,address,...)")`，topic1/topic3 的 indexed 顺序对一笔真实交易回执即可确认。

> **Prompt**：「把 four_watch.mjs 改成支持多 presetId：CFG.presetId 变成 CFG.presets 数组（从 FOUR_PRESET 逗号分隔读）。eth_getLogs 只按 TC_TOPIC 过滤收全部 TokenCreated；在 handleTokens 里对每个 token 读 OpenFourCore.tokens(token) 取它的 preset，只有 preset ∈ CFG.presets 才进入 tryBuy。其余逻辑（preview 判据、跳过、通知、10倍）不变。」

### D. 集成"打 NFT"（mint Agent ID 等准入 NFT）

**做什么**：这个模板要求持 Agent ID NFT。想在面板里一键打新 NFT，用 `baw contract-call` 走自定义调用——和买入同一条路（preview→execute），只是 to/calldata 换成 NFT 合约的 mint。步骤：
1. 找到 NFT 合约和 mint 函数（如 `mint()` / `claim(bytes proof)` / `safeMint(address)`），用 `keccak_256` 算选择器，拼 calldata（参考 four_watch.mjs 的 `buyCalldata`）；
2. 在 `ptah_panel.py` 加 `POST /mint-nft`，body 收 nft 合约、mint 金额（value）、可选 proof；
3. 调 `baw contract-call preview` 给前端展示 risks/模拟结果 → 用户确认 → `execute`；
4. 前端在监控视图加一个"打 Agent ID NFT"卡片。

> ⚠️ 注意：很多准入 NFT 有白名单 / Merkle proof / 社交验证，链上直接 mint 未必成功——**先 preview，看模拟是否通过**再 execute，preview 失败就别花 gas。打完 NFT 再跑 `/four/preflight` 看资格是否变 ready。

> **Prompt**：「在 ptah_panel.py 加 POST /mint-nft（body: nft 合约地址、valueWei、funcSig 如 'mint()' 、可选 args），用 @noble/hashes 算选择器拼 calldata，调 baw contract-call preview 返回模拟与风险给前端；再加 POST /mint-nft/execute 收 requestId 执行。前端监控视图加一张『打 Agent ID NFT』卡，先预览展示 risks/authorityChanges，用户确认后执行。参考 four_watch.mjs 里 buyCalldata 和 baw contract-call 的用法。」

### E. 换通知渠道（手机推送）

**做什么**：`four_watch.mjs` 的 `notify()` 现在用 `osascript`。想推手机，在 `notify()` 里加一个 fetch 到企业微信/Telegram webhook。webhook 地址放环境变量，别硬编码。

> **Prompt**：「four_watch.mjs 的 notify() 除了 osascript，再 POST 到 process.env.FOUR_WEBHOOK（企业微信机器人格式 {msgtype:'text',text:{content}}），FOUR_WEBHOOK 没设就跳过。买入和 10 倍事件都走它。」

### F. 改成卖出/止盈自动化（谨慎）

**做什么**：现在 10 倍只提醒。要自动卖，在 `priceWatchTick` 命中 10 倍分支里，用 `baw market-order swap`（token→BNB）或 `contract-call` 走模板的 `sell(...)` 卖掉一部分。**务必先 preview**，并把卖出比例、滑点做成可配置。

> **Prompt**：「在 four_watch.mjs 的 10 倍分支加可选自动出本：FOUR_TP_SELL_PCT（默认 0，不卖）。>0 时用 baw market-order swap 把持仓的该比例从 token 卖成 BNB，先 preview 再执行，失败只记事件不重试。卖出税按链上 estimate 实算，日志打印净回本金额。」

---

## 常见坑（复刻/改时直接避开）

1. `baw`/`gmgn-cli` 输出是**美化多行 JSON**，解析要切第一个 `{` 到最后一个 `}`，别按行找。
2. 本机 Node fetch 超时 → 子进程带 `NODE_USE_ENV_PROXY=1`。
3. **每块都 getLogs 会瞬间打爆免费 RPC 额度** → 必须节流合并 + 多端点轮换（代码已做，默认 1.2s 合并）。
4. 公共 dataseed 不支持 getLogs 范围查询 → WSS newHeads 用 publicnode 系；getLogs 用 publicnode HTTP 或自带 keyed 端点（`FOUR_LOGS_RPC`）。
5. 代币价格别用链上 estimate 的 executionPrice（低流动性返 0）→ 用 gmgn-cli 实时价。
6. 自动买入**唯一判据是 `contract-call preview` 成功**，别靠写死 preset/白名单假设去猜。
7. 桌面通知 best-effort，不阻塞主流程。

---

## 免责声明

本项目用于学习与自用自动化。链上交易有风险（抢购失败、貔貅、rug、滑点、gas 浪费）。自动买入默认是模拟（`FOUR_ARM` 不设），请先小额确认再切实盘。你对自己的资金和操作负全部责任。不构成任何投资建议。

## License

MIT
