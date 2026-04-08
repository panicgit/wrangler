# Wrangler — Claude Code Plugin

[English](#english) | [한국어](#한국어)

---

## English

A Claude Code plugin that designs **custom multi-agent harnesses tailored to each project**.
Not a fixed template — Wrangler analyzes your project's specific failures and proposes
the right agent architecture (or recommends no harness at all).

### Commands

| Command | Description |
|---------|-------------|
| `/wrangler:design` | Interactive harness design wizard — analyzes failures, picks a pattern, generates agent configs |
| `/wrangler:run <agent>` | Invoke a specific agent from your harness (e.g., `/wrangler:run planner`) |
| `/wrangler:list` | Show all agents in your harness with roles, models, and workflow |

#### Quick Start

```
/wrangler:design          # Design your harness (first time)
/wrangler:list            # See what agents were created
/wrangler:run planner     # Run the planner agent
/wrangler:run generator   # Run the generator agent
/wrangler:run evaluator   # Run the evaluator agent
```

### What It Does

Wrangler is a **harness architect**. The `/wrangler:design` wizard walks you through:

1. **Project analysis** — Understands what you're building (one question at a time)
2. **Failure diagnosis** — Classifies observed single-agent failures (direction / execution / quality / context)
3. **Custom harness design** — Proposes the minimal agent combination that fixes YOUR failures
4. **Config generation** — Creates `.wrangler/harness.json` + agent system prompts

Then use `/wrangler:run <agent>` to invoke each agent with its tailored system prompt.

#### Not Every Project Needs a Harness

Wrangler may recommend **no harness at all** if a single agent is sufficient.

| Project | Recommended Architecture |
|---------|------------------------|
| Complex full-stack app | Planner → Generator → Evaluator |
| Design / creative task | Generator → Critic |
| Data migration | Validator → Transformer → Validator |
| Parallelizable workload | Decomposer → Workers → Assembler |
| Long task, no quality issues | Single agent + context reset |
| Simple feature | No harness needed |

### Installation

#### Via Marketplace (recommended)

```bash
# In Claude Code:
/marketplace add panicgit/wrangler
/plugin install wrangler@panicdev
```

#### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/panicgit/wrangler.git

# 2. Create the plugin directory
mkdir -p ~/.claude/plugins/cache/panicdev/wrangler/1.0.1

# 3. Copy contents (not the directory itself)
cp -r wrangler/* ~/.claude/plugins/cache/panicdev/wrangler/1.0.1/
cp -r wrangler/.claude-plugin ~/.claude/plugins/cache/panicdev/wrangler/1.0.1/

# 4. Install dependencies
cd ~/.claude/plugins/cache/panicdev/wrangler/1.0.1
npm install

# 5. Restart Claude Code
```

#### Update & Version Check

```bash
/plugin update wrangler@panicdev    # Update to latest
/plugin list                        # Check installed version
```

### Generated Files

After running `/wrangler:design`, all harness files are stored in `.wrangler/` at your project root:

```
.wrangler/
├── harness.json                               ← Harness config (agents, workflow, loops)
├── progress.md                                ← Global progress (all agents read/write)
├── agents/
│   ├── planner.md                             ← Planner system prompt
│   ├── generator.md                           ← Generator system prompt
│   └── evaluator.md                           ← Evaluator system prompt
├── sprint-1/
│   ├── planner-to-generator--contract.md      ← Sprint scope + completion criteria
│   ├── evaluator-to-generator--feedback-01.md ← 1st evaluation
│   └── generator-to-next--handoff.md          ← Handoff when sprint ends
└── sprint-2/
    └── ...
```

### Plugin Structure

```
wrangler/
├── .claude-plugin/
│   ├── plugin.json                    ← Plugin metadata
│   └── marketplace.json               ← Marketplace catalog
├── skills/
│   ├── design/
│   │   └── SKILL.md                   ← /wrangler:design — harness design wizard
│   ├── run/
│   │   └── SKILL.md                   ← /wrangler:run — agent runner
│   └── list/
│       └── SKILL.md                   ← /wrangler:list — show agents
├── docs/
│   ├── 01-failure-analysis.md         ← Failure mode classification framework
│   ├── 02-agent-roles.md              ← Agent role separation principles
│   ├── 03-grading-criteria.md         ← Grading criteria design guide
│   ├── 04-context-management.md       ← Context reset & handoff
│   └── 05-iterative-loop.md           ← Iteration loop design
├── templates/
│   ├── planner-system-prompt.md       ← Planner agent system prompt template
│   ├── generator-system-prompt.md     ← Generator agent system prompt template
│   ├── evaluator-system-prompt.md     ← Evaluator agent system prompt template
│   ├── handoff-artifact.md            ← Cross-session handoff artifact
│   ├── claude-progress.md             ← Progress tracking file
│   └── sprint-contract.md             ← Sprint contract
└── tools/                             ← Optional: standalone CLI runner
    ├── tool-executor.js
    ├── context-reset.js
    └── progress-tracker.js
```

### Core Principles

1. **Always baseline first** — No observed failure → no harness
2. **Design for the failure, not the framework** — Each component must address a specific problem
3. **Cognitive conflicts must be separated** — Creating and evaluating in the same agent always fails
4. **Harnesses are temporary** — Remove unnecessary components as models improve
5. **Logs over output** — Read the agent's process, not just the result

### References

- [Harnessing Claude's Intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

---

## 한국어

프로젝트에 맞는 **커스텀 멀티 에이전트 하네스를 설계**하는 Claude Code 플러그인입니다.
고정된 템플릿이 아닙니다 — Wrangler는 프로젝트의 구체적인 실패를 분석하고
적절한 에이전트 아키텍처를 제안합니다 (하네스가 필요 없다면 그렇게 추천합니다).

### 명령어

| 명령어 | 설명 |
|--------|------|
| `/wrangler:design` | 하네스 설계 위자드 — 실패 분석, 패턴 선택, 에이전트 설정 생성 |
| `/wrangler:run <에이전트>` | 하네스에서 특정 에이전트 실행 (예: `/wrangler:run planner`) |
| `/wrangler:list` | 하네스에 등록된 에이전트 목록, 역할, 모델, 워크플로우 조회 |

#### 빠른 시작

```
/wrangler:design          # 하네스 설계 (처음 1회)
/wrangler:list            # 생성된 에이전트 확인
/wrangler:run planner     # 플래너 에이전트 실행
/wrangler:run generator   # 제너레이터 에이전트 실행
/wrangler:run evaluator   # 이밸류에이터 에이전트 실행
```

### 기능

Wrangler는 **하네스 아키텍트**입니다. `/wrangler:design` 위자드가 안내합니다:

1. **프로젝트 분석** — 무엇을 만들고 있는지 파악 (한 번에 하나씩 질문)
2. **실패 진단** — 싱글 에이전트 실패 유형 분류 (방향 / 실행 / 품질 / 컨텍스트)
3. **커스텀 하네스 설계** — 해당 실패를 해결하는 최소한의 에이전트 조합 제안
4. **설정 생성** — `.wrangler/harness.json` + 에이전트 시스템 프롬프트 생성

이후 `/wrangler:run <에이전트>`로 각 에이전트를 맞춤 시스템 프롬프트와 함께 실행합니다.

#### 모든 프로젝트에 하네스가 필요한 건 아닙니다

싱글 에이전트로 충분하다면 **하네스 없음**을 추천할 수 있습니다.

| 프로젝트 | 추천 아키텍처 |
|----------|--------------|
| 복잡한 풀스택 앱 | 플래너 → 제너레이터 → 이밸류에이터 |
| 디자인 / 창작 작업 | 제너레이터 → 크리틱 |
| 데이터 마이그레이션 | 밸리데이터 → 트랜스포머 → 밸리데이터 |
| 병렬 처리 가능한 작업 | 디컴포저 → 워커 → 어셈블러 |
| 긴 작업, 품질 이슈 없음 | 싱글 에이전트 + 컨텍스트 리셋 |
| 간단한 기능 | 하네스 불필요 |

### 설치

#### 마켓플레이스 (추천)

```bash
# Claude Code에서:
/marketplace add panicgit/wrangler
/plugin install wrangler@panicdev
```

#### 수동 설치

```bash
# 1. 레포 클론
git clone https://github.com/panicgit/wrangler.git

# 2. 플러그인 디렉토리 생성
mkdir -p ~/.claude/plugins/cache/panicdev/wrangler/1.0.1

# 3. 내용물 복사 (디렉토리 자체가 아닌 안의 파일들)
cp -r wrangler/* ~/.claude/plugins/cache/panicdev/wrangler/1.0.1/
cp -r wrangler/.claude-plugin ~/.claude/plugins/cache/panicdev/wrangler/1.0.1/

# 4. 의존성 설치
cd ~/.claude/plugins/cache/panicdev/wrangler/1.0.1
npm install

# 5. Claude Code 재시작
```

#### 업데이트 및 버전 확인

```bash
/plugin update wrangler@panicdev    # 최신 버전으로 업데이트
/plugin list                        # 설치된 버전 확인
```

### 생성되는 파일

`/wrangler:design` 실행 후 모든 하네스 파일은 프로젝트 루트의 `.wrangler/`에 저장됩니다:

```
.wrangler/
├── harness.json                               ← 하네스 설정 (에이전트, 워크플로우, 루프)
├── progress.md                                ← 전체 진행 상태 (모든 에이전트가 읽기/쓰기)
├── agents/
│   ├── planner.md                             ← 플래너 시스템 프롬프트
│   ├── generator.md                           ← 제너레이터 시스템 프롬프트
│   └── evaluator.md                           ← 이밸류에이터 시스템 프롬프트
├── sprint-1/
│   ├── planner-to-generator--contract.md      ← 스프린트 범위 + 완료 기준
│   ├── evaluator-to-generator--feedback-01.md ← 1차 평가
│   └── generator-to-next--handoff.md          ← 스프린트 종료 시 핸드오프
└── sprint-2/
    └── ...
```

### 핵심 원칙

1. **항상 베이스라인 먼저** — 관찰된 실패가 없으면 하네스도 불필요
2. **실패에 맞게 설계** — 각 컴포넌트는 구체적인 문제를 해결해야 함
3. **인지적 충돌은 분리** — 생성과 평가를 같은 에이전트에서 하면 반드시 실패
4. **하네스는 임시적** — 모델이 개선되면 불필요한 컴포넌트를 제거
5. **결과보다 로그** — 최종 결과물이 아닌 에이전트의 추론 과정을 읽을 것

### 참고 자료

- [Harnessing Claude's Intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## License

MIT
