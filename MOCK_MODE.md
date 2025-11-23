# Mock 모드 가이드

백엔드 없이 프론트엔드만 테스트할 수 있는 Mock 모드입니다.

## 🎭 Mock 모드란?

- Python 백엔드 서버 없이도 업스케일링 UI를 테스트할 수 있습니다
- 실제 업스케일링은 수행되지 않고, 원본 이미지를 그대로 반환합니다
- 2초 딜레이로 실제 처리를 시뮬레이션합니다
- **프론트엔드 개발 및 UI 테스트 전용**입니다

## 🚀 사용 방법

### 방법 1: 환경 변수 설정

`.env.local` 파일에 다음 추가:

```env
NEXT_PUBLIC_MOCK_UPSCALE=true
```

### 방법 2: 명령줄에서 실행

**macOS/Linux:**
```bash
NEXT_PUBLIC_MOCK_UPSCALE=true npm run dev
```

**Windows (PowerShell):**
```powershell
$env:NEXT_PUBLIC_MOCK_UPSCALE="true"; npm run dev
```

**Windows (CMD):**
```cmd
set NEXT_PUBLIC_MOCK_UPSCALE=true && npm run dev
```

### 방법 3: package.json 스크립트 추가

`package.json`에 추가:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mock": "NEXT_PUBLIC_MOCK_UPSCALE=true next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

사용:
```bash
npm run dev:mock
```

---

## ✅ Mock 모드 확인

### 1. 서버 시작 후 확인

```bash
npm run dev
```

브라우저에서:
```
http://localhost:3000/api/upscale
```

**Mock 모드 활성화 시:**
```json
{
  "status": "ok",
  "backend": "mock",
  "backend_url": "MOCK_MODE",
  "message": "Mock mode enabled for frontend testing"
}
```

**실제 백엔드 연결 시:**
```json
{
  "status": "ok",
  "backend": "connected",
  "backend_url": "http://localhost:8000"
}
```

### 2. 업스케일 페이지 테스트

1. http://localhost:3000/upscale 접속
2. 이미지 업로드
3. 배율 선택 (2x 또는 4x)
4. "업스케일 시작" 버튼 클릭
5. 2초 후 결과 표시 (원본 그대로)

**콘솔 확인:**
```
🎭 Mock mode: Simulating upscale (scale: 4x)
```

---

## 📋 Mock 모드 vs 실제 모드

| 항목 | Mock 모드 | 실제 모드 |
|------|-----------|-----------|
| 백엔드 필요 | ❌ 불필요 | ✅ 필요 |
| GPU 필요 | ❌ 불필요 | ✅ 필요 (CUDA) |
| 실제 업스케일 | ❌ 안 됨 | ✅ 됨 |
| 처리 시간 | 2초 (고정) | 1-15초 (이미지 크기에 따라) |
| 결과 이미지 | 원본 그대로 | 고해상도 업스케일 |
| 용도 | 프론트엔드 테스트 | 실제 사용 |

---

## 🔧 Mock 모드 활용 사례

### 1. UI/UX 테스트
- 업스케일 버튼 동작 확인
- 로딩 상태 확인
- 비교 슬라이더 테스트
- 다운로드 기능 테스트

### 2. 프론트엔드 개발
- 백엔드 없이 독립적으로 개발
- API 인터페이스 테스트
- 에러 핸들링 확인

### 3. CI/CD 테스트
- GitHub Actions에서 프론트엔드 빌드 테스트
- Vercel Preview 배포 테스트

### 4. 데모/프레젠테이션
- 백엔드 서버 없이도 데모 가능
- 빠른 시연

---

## ⚠️ 주의사항

1. **실제 업스케일링은 안 됩니다**
   - Mock 모드는 원본 이미지를 그대로 반환합니다
   - UI 테스트 전용입니다

2. **프로덕션에서는 사용 금지**
   - Mock 모드는 개발/테스트 전용입니다
   - Vercel 배포 시 `NEXT_PUBLIC_MOCK_UPSCALE=false` 또는 설정하지 마세요

3. **이미지 크기는 변경 안 됨**
   - Mock 데이터에서 크기만 시뮬레이션됩니다
   - 실제 이미지는 원본 그대로입니다

---

## 🧪 테스트 시나리오

### 시나리오 1: 업스케일 페이지 테스트

```bash
# Mock 모드 활성화
echo "NEXT_PUBLIC_MOCK_UPSCALE=true" >> .env.local

# 서버 시작
npm run dev

# 브라우저에서 테스트
# 1. http://localhost:3000/upscale 접속
# 2. 이미지 업로드
# 3. 업스케일 버튼 클릭
# 4. 2초 후 결과 확인
```

### 시나리오 2: 메인 스튜디오 테스트

```bash
# Mock 모드 활성화
NEXT_PUBLIC_MOCK_UPSCALE=true npm run dev

# 브라우저에서 테스트
# 1. http://localhost:3000 접속
# 2. 이미지 생성 또는 업로드
# 3. 하단 "Upscale" 버튼 클릭
# 4. 갤러리에 추가 확인
```

### 시나리오 3: API 직접 테스트

```bash
# 서버 시작 (Mock 모드)
NEXT_PUBLIC_MOCK_UPSCALE=true npm run dev

# API 테스트 (curl 또는 Postman)
curl -X POST http://localhost:3000/api/upscale \
  -H "Content-Type: application/json" \
  -d '{"image": "iVBORw0KGgo...", "scale": 4}'

# 응답 확인
{
  "success": true,
  "upscaled_image": "data:image/png;base64,iVBORw0KGgo...",
  "original_size": {"width": 512, "height": 512},
  "upscaled_size": {"width": 2048, "height": 2048},
  "scale": 4,
  "model": "MOCK_MODE"
}
```

---

## 🔄 Mock 모드 해제

### 방법 1: 환경 변수 제거

`.env.local`에서 다음 줄 삭제 또는 주석 처리:
```env
# NEXT_PUBLIC_MOCK_UPSCALE=true
```

### 방법 2: false로 설정

```env
NEXT_PUBLIC_MOCK_UPSCALE=false
```

### 방법 3: 명령줄에서 실행

```bash
NEXT_PUBLIC_MOCK_UPSCALE=false npm run dev
```

서버 재시작 필요!

---

## 💡 팁

1. **개발 중에는 Mock 모드 사용**
   - 빠른 개발 및 테스트
   - 백엔드 설정 불필요

2. **최종 테스트는 실제 모드로**
   - 실제 업스케일링 품질 확인
   - 성능 테스트

3. **Vercel Preview에서는 Mock 모드 활용**
   - Preview 배포에서는 백엔드 없이 UI만 확인
   - Production은 실제 모드

---

## 🎉 완료!

이제 백엔드 없이도 프론트엔드를 자유롭게 테스트할 수 있습니다!

**Mock 모드 시작:**
```bash
NEXT_PUBLIC_MOCK_UPSCALE=true npm run dev
```

**실제 모드로 전환:**
```bash
# .env.local에서 NEXT_PUBLIC_MOCK_UPSCALE 제거
npm run dev
```
