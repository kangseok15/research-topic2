# 세특 주제 선정 및 예상 보고서 작성 도우미

고등학생의 교과 탐구 주제 선정부터 탐구 계획서 및 세특 초안 작성을 돕는 AI 기반 컨설팅 솔루션입니다.

## ✨ 주요 기능

- **탐구 주제 추천**: 희망 학과와 관심사를 기반으로 AI가 맞춤형 탐구 주제 3가지 추천
- **동기 구체화**: 교과 수업 연계 / 시사 문제 연계 / 독서·실생활 연계 유형별 동기 생성
- **핵심 역량 분석**: 탐구 활동을 통해 드러낼 수 있는 역량과 행동 특성 제시
- **후속 활동 제안**: 심화탐구형·사례분석형·비교분석형 등 다양한 후속 활동 추천
- **세특 초안 작성**: 교사 관점의 세부능력특기사항 1000byte 이내 초안 자동 생성
- **탐구 계획서 다운로드**: 완성된 결과를 Word 문서(.docx)로 저장

## 🛠 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Motion (Framer Motion)
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **문서 생성**: docx + file-saver

## 🚀 시작하기

### 사전 준비

- Node.js 18 이상
- [Anthropic API 키](https://console.anthropic.com/)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/세특-주제-선정-및-예상-보고서-작성-도우미.git
cd 세특-주제-선정-및-예상-보고서-작성-도우미

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 VITE_ANTHROPIC_API_KEY에 실제 API 키 입력

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 빌드

```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
├── src/
│   ├── App.tsx          # 메인 앱 (7단계 UI 플로우)
│   ├── main.tsx         # 진입점
│   ├── index.css        # 전역 스타일
│   └── lib/
│       └── anthropic.ts # Claude API 호출 함수
├── index.html
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

## 📝 사용 방법

1. **기본 정보 입력**: 희망 학과, 관심 주제, 기존 활동 내용 입력
2. **탐구 주제 선택**: AI가 추천한 3가지 주제 중 하나 선택
3. **동기 선택**: 3가지 유형의 동기 중 가장 적합한 것 선택
4. **핵심 역량 선택**: 탐구와 연결된 역량 1개 이상 선택
5. **후속 활동 선택**: 추천된 후속 활동 중 하나 선택
6. **세특 초안 확인**: 자동 생성된 세특 초안 검토 및 편집
7. **결과 다운로드**: 탐구 계획서를 Word 문서로 저장

## ⚠️ 주의사항

- API 키는 절대 코드에 직접 입력하지 마세요. `.env.local` 파일을 사용하세요.
- `.env.local` 파일은 `.gitignore`에 포함되어 GitHub에 업로드되지 않습니다.
- 생성된 세특 초안은 참고용이며, 반드시 학생 본인의 실제 활동 내용으로 수정해야 합니다.

## 📄 라이선스

Apache-2.0
