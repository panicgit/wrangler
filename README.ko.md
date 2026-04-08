# Wrangler — Claude Code 플러그인

프로젝트에 맞는 **커스텀 멀티 에이전트 하네스를 설계**하는 Claude Code 플러그인입니다.
고정된 템플릿이 아닙니다 — Wrangler는 프로젝트의 구체적인 실패를 분석하고
적절한 에이전트 아키텍처를 제안합니다 (하네스가 필요 없다면 그렇게 추천합니다).

## 명령어

| 명령어 | 설명 |
|--------|------|
| `/wrangler:design` | 하네스 설계 위자드 — 실패 분석, 패턴 선택, 에이전트 설정 생성 |
| `/wrangler:run <에이전트>` | 하네스에서 특정 에이전트 실행 (예: `/wrangler:run planner`) |
| `/wrangler:list` | 하네스에 등록된 에이전트 목록, 역할, 모델, 워크플로우 조회 |

### 빠른 시작

```
/wrangler:design          # 하네스 설계 (처음 1회)
/wrangler:list            # 생성된 에이전트 확인
/wrangler:run planner     # 플래너 에이전트 실행
/wrangler:run generator   # 제너레이터 에이전트 실행
/wrangler:run evaluator   # 이밸류에이터 에이전트 실행
```

## 기능

Wrangler는 **하네스 아키텍트**입니다. `/wrangler:design` 위자드가 안내합니다:

1. **프로젝트 분석** — 무엇을 만들고 있는지 파악 (한 번에 하나씩 질문)
2. **실패 진단** — 싱글 에이전트 실패 유형 분류 (방향 / 실행 / 품질 / 컨텍스트)
3. **커스텀 하네스 설계** — 해당 실패를 해결하는 최소한의 에이전트 조합 제안
4. **설정 생성** — `.wrangler/harness.json` + 에이전트 시스템 프롬프트 생성

이후 `/wrangler:run <에이전트>`로 각 에이전트를 맞춤 시스템 프롬프트와 함께 실행합니다.

### 모든 프로젝트에 하네스가 필요한 건 아닙니다

싱글 에이전트로 충분하다면 **하네스 없음**을 추천할 수 있습니다.
프로젝트마다 다른 아키텍처가 적용됩니다:

| 프로젝트 | 추천 아키텍처 |
|----------|--------------|
| 복잡한 풀스택 앱 | 플래너 → 제너레이터 → 이밸류에이터 |
| 디자인 / 창작 작업 | 제너레이터 → 크리틱 |
| 데이터 마이그레이션 | 밸리데이터 → 트랜스포머 → 밸리데이터 |
| 병렬 처리 가능한 작업 | 디컴포저 → 워커 → 어셈블러 |
| 긴 작업, 품질 이슈 없음 | 싱글 에이전트 + 컨텍스트 리셋 |
| 간단한 기능 | 하네스 불필요 |

## 설치

### 마켓플레이스 (추천)

```bash
# Claude Code에서:
/marketplace add panicgit/wrangler
/plugin install wrangler@panicdev
```

### 수동 설치

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

### 업데이트

```bash
/plugin update wrangler@panicdev
```

### 버전 확인

```bash
/plugin list
```

## 생성되는 파일

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

## 플러그인 구조

```
wrangler/
├── .claude-plugin/
│   ├── plugin.json                    ← 플러그인 메타데이터
│   └── marketplace.json               ← 마켓플레이스 카탈로그
├── skills/
│   ├── design/
│   │   └── SKILL.md                   ← /wrangler:design — 하네스 설계 위자드
│   ├── run/
│   │   └── SKILL.md                   ← /wrangler:run — 에이전트 실행
│   └── list/
│       └── SKILL.md                   ← /wrangler:list — 에이전트 목록
├── docs/
│   ├── 01-failure-analysis.md         ← 실패 모드 분류 프레임워크
│   ├── 02-agent-roles.md              ← 에이전트 역할 분리 원칙
│   ├── 03-grading-criteria.md         ← 채점 기준 설계 가이드
│   ├── 04-context-management.md       ← 컨텍스트 리셋 및 핸드오프
│   └── 05-iterative-loop.md           ← 반복 루프 설계
├── templates/
│   ├── planner-system-prompt.md       ← 플래너 에이전트 시스템 프롬프트 템플릿
│   ├── generator-system-prompt.md     ← 제너레이터 에이전트 시스템 프롬프트 템플릿
│   ├── evaluator-system-prompt.md     ← 이밸류에이터 에이전트 시스템 프롬프트 템플릿
│   ├── handoff-artifact.md            ← 세션 간 핸드오프 아티팩트
│   ├── claude-progress.md             ← 진행 상태 파일
│   └── sprint-contract.md             ← 스프린트 계약서
└── tools/                             ← 선택: 독립 실행 CLI 러너
    ├── tool-executor.js
    ├── context-reset.js
    └── progress-tracker.js
```

## 핵심 원칙

1. **항상 베이스라인 먼저** — 관찰된 실패가 없으면 하네스도 불필요
2. **실패에 맞게 설계** — 각 컴포넌트는 구체적인 문제를 해결해야 함
3. **인지적 충돌은 분리** — 생성과 평가를 같은 에이전트에서 하면 반드시 실패
4. **하네스는 임시적** — 모델이 개선되면 불필요한 컴포넌트를 제거
5. **결과보다 로그** — 최종 결과물이 아닌 에이전트의 추론 과정을 읽을 것

## 참고 자료

- [Harnessing Claude's Intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## 라이선스

MIT
