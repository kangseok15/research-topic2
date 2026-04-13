const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(prompt: string, jsonMode = false): Promise<string> {
  const systemPrompt = jsonMode
    ? "You are a helpful assistant. Always respond with valid JSON only. No markdown, no explanation, just raw JSON."
    : "You are a helpful assistant for Korean high school students.";

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

export async function generateTopics(department: string, interest: string, activities: string) {
  const prompt = `
    희망 학과: ${department}
    관심 주제/호기심: ${interest}
    기존 활동: ${activities}

    위 정보를 바탕으로 고등학생 수준의 심화 탐구 주제 3가지를 추천해줘.
    반드시 아래 JSON 형식으로만 응답해줘:
    {
      "topics": [
        { "title": "주제명", "description": "간략한 설명 및 탐구 방향성" },
        ...
      ]
    }
  `;
  return callClaude(prompt, true);
}

export async function generateMotivations(topic: string) {
  const prompt = `
    확정된 탐구 주제: ${topic}

    이 주제를 선정한 '동기'를 학생부 기록에 활용할 수 있도록 다음 3가지 유형으로 구체화해서 제시해줘.
    반드시 아래 JSON 형식으로만 응답해줘:
    {
      "motivations": [
        { "type": "교과 수업 연계", "content": "내용" },
        { "type": "시사 문제 연계", "content": "내용" },
        { "type": "독서/실생활 연계", "content": "내용" }
      ]
    }
  `;
  return callClaude(prompt, true);
}

export async function generateCompetencies(topic: string) {
  const prompt = `
    탐구 주제: ${topic}

    이 탐구 활동을 통해 학생이 드러낼 수 있는 핵심 역량(예: 학업역량, 탐구력, 문제해결력, 융합적 사고력 등)을 구체적인 행동 특성과 연결하여 3~4가지 제시해줘.
    반드시 아래 JSON 형식으로만 응답해줘:
    {
      "competencies": [
        { "name": "역량명", "behavior": "구체적인 행동 특성" },
        ...
      ]
    }
  `;
  return callClaude(prompt, true);
}

export async function generateFollowUps(topic: string) {
  const prompt = `
    탐구 주제: ${topic}

    활동 이후 추가로 호기심을 확장할 수 있는 후속 활동을 제시해줘.
    심화탐구형, 사례분석형, 비교분석형, 심화 독서형, 실생활 적용형 중 3가지 이상의 구체적인 후속 활동 사례를 제시해줘.
    반드시 아래 JSON 형식으로만 응답해줘:
    {
      "followUps": [
        { "type": "활동 유형", "content": "구체적인 활동 내용" },
        ...
      ]
    }
  `;
  return callClaude(prompt, true);
}

export async function generateSeTeuk(data: any) {
  const prompt = `
    다음 정보를 바탕으로 1000 byte 이내의 교사 관점 세특 개요를 작성해줘.

    [정보]
    - 탐구 주제: ${data.topic}
    - 탐구 동기: ${data.motivation}
    - 핵심 역량: ${data.competency}
    - 후속 활동: ${data.followUp}

    [작성 세부 지침]
    1. 구조: [탐구 동기] -> [구체적인 과정 및 결과] -> [교사의 관찰 내용] -> [핵심 역량] -> [탐구 후속활동] 순서로 유기적으로 연결.
    2. 어투 및 주어:
       - 교사의 입장에서 관찰한 형태.
       - 주어(학생은, 이 학생은) 생략.
       - 종결형 어미는 명사형(~임, ~함).
       - 현재형으로 작성 (예: '함' ⭕, '하였음' ❌).
    3. 내용: 구체적인 사례와 근거 기반, 과도한 미화 배제, 독창적인 스토리.
    4. 도서 표기: '책제목(저자)' 형태.
    5. 금지어 대체 준수:
       - 네이버/구글/다음 -> 포탈사이트
       - 유튜브 -> 동영상 공유 플랫폼
       - Chat GPT -> 생성형 인공지능
    6. **중요: 반드시 줄 바꿈 없이 하나의 단락으로만 작성해줘.**
  `;
  return callClaude(prompt, false);
}

export async function generateResearchPlan(data: any) {
  const prompt = `
    다음 정보를 바탕으로 체계적인 탐구 계획서를 완성해줘.
    결과는 반드시 아래 JSON 형식으로만 응답해줘:
    {
      "plan": [
        { "category": "주제", "content": "구체적 주제" },
        { "category": "주제 개요", "content": "전반적인 개요" },
        { "category": "주제 선정의 이유(동기)", "content": "선택한 동기 구체화" },
        { 
          "category": "탐구 방법 (단계별 흐름)", 
          "isStepByStep": true,
          "steps": [
            { "step": "1단계", "title": "기초 조사", "description": "내용" },
            { "step": "2단계", "title": "심화 탐구", "description": "내용" },
            { "step": "3단계", "title": "결과 도출", "description": "내용" }
          ]
        },
        { "category": "탐구 내용", "content": "주제에 대한 구체적인 탐구 전개 내용" },
        { "category": "예상 결과", "content": "도출될 것으로 기대되는 결과" },
        { "category": "함양하게 된 역량", "content": "선택한 역량 구체화" },
        { "category": "후속활동", "content": "선택한 후속 활동 구체화" }
      ]
    }

    [정보]
    - 주제: ${data.topic}
    - 동기: ${data.motivation}
    - 역량: ${data.competency}
    - 후속활동: ${data.followUp}
    - 세특 초안: ${data.seTeuk}
  `;
  return callClaude(prompt, true);
}
