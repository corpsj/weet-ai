# Vercel 배포 가이드 (로컬 백엔드 사용)

프론트엔드는 Vercel에 배포하고, 백엔드는 로컬 PC(RTX 3080 Ti)에서 실행하는 방법입니다.

## 🎯 목표

```
사용자 → Vercel (Next.js) → Cloudflare Tunnel → 내 컴퓨터 (Real-ESRGAN)
```

---

## 📋 1단계: Cloudflare Tunnel 설정

### 1.1 Cloudflare 계정 생성

1. [Cloudflare](https://dash.cloudflare.com/sign-up) 가입 (무료)

### 1.2 Cloudflared 설치 (Windows)

**방법 1: 다운로드**
1. [cloudflared 다운로드](https://github.com/cloudflare/cloudflared/releases/latest)
2. `cloudflared-windows-amd64.exe` 다운로드
3. `cloudflared.exe`로 이름 변경
4. `C:\cloudflared\` 폴더에 이동

**방법 2: winget 사용**
```cmd
winget install --id Cloudflare.cloudflare-warp
```

### 1.3 Cloudflare 로그인

```cmd
cd C:\cloudflared
cloudflared login
```

브라우저가 열리면 로그인 후 터널 권한 부여

### 1.4 터널 생성

```cmd
cloudflared tunnel create upscale-backend
```

다음과 같이 출력됩니다:
```
Created tunnel upscale-backend with id [TUNNEL-ID]
```

**TUNNEL-ID를 복사해두세요!**

### 1.5 터널 설정 파일 생성

`C:\cloudflared\config.yml` 파일 생성:

```yaml
tunnel: [TUNNEL-ID]
credentials-file: C:\Users\[사용자명]\.cloudflared\[TUNNEL-ID].json

ingress:
  - hostname: your-backend.example.com
    service: http://localhost:8000
  - service: http_status:404
```

**주의:** `[TUNNEL-ID]`와 `[사용자명]`을 실제 값으로 변경

### 1.6 DNS 설정

```cmd
cloudflared tunnel route dns upscale-backend your-backend.example.com
```

**또는 Cloudflare 대시보드에서:**
1. DNS → 레코드 추가
2. 타입: CNAME
3. 이름: your-backend (또는 원하는 서브도메인)
4. 대상: `[TUNNEL-ID].cfargotunnel.com`

### 1.7 터널 실행 테스트

```cmd
cloudflared tunnel run upscale-backend
```

백엔드 서버도 실행:
```cmd
cd backend
start-server.bat
```

브라우저에서 `https://your-backend.example.com` 접속하여 확인

---

## 🔄 2단계: 자동 시작 설정 (Windows)

### 방법 1: Windows 서비스로 등록

```cmd
cloudflared service install
```

서비스 시작:
```cmd
sc start cloudflared
```

### 방법 2: 시작 프로그램 등록

**배치 파일 생성** (`C:\cloudflared\start-tunnel.bat`):

```batch
@echo off
cd C:\cloudflared
start "" cloudflared tunnel run upscale-backend
```

**시작 프로그램에 추가:**
1. `Win + R` → `shell:startup`
2. `start-tunnel.bat` 바로가기 복사

---

## 🌐 3단계: Vercel 배포

### 3.1 GitHub에 푸시

```bash
git add .
git commit -m "Add Real-ESRGAN upscaling feature"
git push origin main
```

### 3.2 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 로그인
2. "Add New Project" 클릭
3. GitHub 리포지토리 연결
4. 프로젝트 import

### 3.3 환경 변수 설정

Vercel 프로젝트 설정 → Environment Variables:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
UPSCALE_BACKEND_URL=https://your-backend.example.com
```

**중요:** `UPSCALE_BACKEND_URL`에 Cloudflare Tunnel URL 입력

### 3.4 배포

Vercel이 자동으로 배포합니다.

배포 완료 후:
```
https://your-project.vercel.app
```

---

## 🔧 4단계: 백엔드 CORS 설정

백엔드가 Vercel에서 온 요청을 허용하도록 설정해야 합니다.

`backend/server.py` 수정:

```python
# CORS 설정 (기존)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-project.vercel.app",  # 추가
        "https://*.vercel.app",              # Vercel preview 배포용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

백엔드 재시작:
```cmd
# Ctrl+C로 종료 후
start-server.bat
```

---

## ✅ 5단계: 테스트

### 5.1 로컬 백엔드 확인

```
https://your-backend.example.com
```

다음과 같이 표시되면 정상:
```json
{
  "status": "running",
  "device": "cuda",
  "cuda_available": true,
  "gpu_name": "NVIDIA GeForce RTX 3080 Ti"
}
```

### 5.2 Vercel 프론트엔드 확인

```
https://your-project.vercel.app
```

### 5.3 업스케일 테스트

1. `https://your-project.vercel.app/upscale` 접속
2. 이미지 업로드
3. 업스케일 버튼 클릭
4. 결과 확인

---

## 📊 비용 분석

| 항목 | 비용 | 설명 |
|------|------|------|
| Vercel (Hobby) | **무료** | 프론트엔드 호스팅 |
| Cloudflare Tunnel | **무료** | 백엔드 터널링 |
| 로컬 PC 전기료 | ~$20-50/월 | 24시간 가동 시 |
| **총합** | **~$20-50/월** | 클라우드 GPU보다 훨씬 저렴 |

**비교: 클라우드 GPU 사용 시**
- AWS EC2 g4dn.xlarge (T4 GPU): **$526/월**
- RunPod RTX 3080: **$200-300/월**
- **로컬이 10배 이상 저렴!**

---

## 🔐 보안 고려사항

### 1. API 키 보호

Vercel 환경 변수에 저장 (GitHub에 노출 안 됨)

### 2. 백엔드 인증 추가 (선택사항)

`backend/server.py`에 간단한 API 키 인증 추가:

```python
from fastapi import Header, HTTPException

API_KEY = "your-secret-api-key"

@app.post("/upscale")
async def upscale_image(
    image: str = Form(...),
    scale: int = Form(4),
    model: str = Form("RealESRGAN_x4plus"),
    x_api_key: str = Header(None)
):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # ... 기존 코드
```

프론트엔드 API 라우트 수정:

```typescript
// src/app/api/upscale/route.ts
const response = await fetch(`${BACKEND_URL}/upscale`, {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.BACKEND_API_KEY || '',
  },
  body: formData,
});
```

Vercel 환경 변수에 추가:
```env
BACKEND_API_KEY=your-secret-api-key
```

### 3. Rate Limiting (선택사항)

요청 제한으로 남용 방지:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/upscale")
@limiter.limit("10/minute")  # 분당 10회 제한
async def upscale_image(...):
    ...
```

---

## 🛠️ 대안: ngrok 사용 (더 간단하지만 제한적)

### ngrok 설치

1. [ngrok 다운로드](https://ngrok.com/download)
2. 가입 후 authtoken 받기
3. 설치

```cmd
ngrok authtoken [YOUR-AUTH-TOKEN]
```

### ngrok 실행

```cmd
ngrok http 8000
```

출력:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:8000
```

**단점:**
- 무료 플랜은 URL이 재시작마다 변경됨
- Vercel 환경 변수를 매번 업데이트해야 함

**유료 플랜** ($8/월):
- 고정 URL
- 더 많은 연결

---

## 📁 최종 파일 구조

```
weet-ai_v3(claude)/
├── backend/
│   ├── server.py                 # CORS 설정 업데이트됨
│   └── start-server.bat          # 백엔드 시작
├── src/
│   └── app/
│       └── api/upscale/route.ts  # UPSCALE_BACKEND_URL 사용
├── .env.local                    # 로컬 개발용
└── vercel.json                   # Vercel 설정 (선택)
```

---

## 🚀 실행 절차 요약

### Windows PC (백엔드)

```cmd
# 터미널 1: Cloudflare Tunnel
cloudflared tunnel run upscale-backend

# 터미널 2: 백엔드 서버
cd backend
start-server.bat
```

### Vercel (자동)

- 코드 푸시하면 자동 배포
- 환경 변수만 설정하면 됨

---

## ❓ 문제 해결

### "Backend disconnected" 오류

1. Windows PC가 켜져있는지 확인
2. Cloudflare Tunnel이 실행 중인지 확인
3. 백엔드 서버가 실행 중인지 확인

### Cloudflare Tunnel URL 접속 안 됨

1. DNS 전파 대기 (최대 24시간)
2. `cloudflared tunnel info upscale-backend`로 상태 확인
3. `config.yml` 설정 재확인

### CORS 오류

1. `backend/server.py`의 `allow_origins`에 Vercel URL 추가
2. 백엔드 재시작

---

## 💡 팁

1. **전력 관리**: Windows 절전 모드 비활성화
   - 설정 → 전원 → 절전 모드 → 안 함

2. **방화벽**: Cloudflare Tunnel은 방화벽 설정 불필요

3. **모니터링**: 백엔드 로그를 파일로 저장
   ```cmd
   python server.py > upscale.log 2>&1
   ```

4. **자동 재시작**: 백엔드가 죽으면 자동 재시작 스크립트
   ```batch
   :loop
   python server.py
   timeout /t 5
   goto loop
   ```

---

## 🎉 완료!

이제 전 세계 어디서나 내 RTX 3080 Ti GPU로 이미지를 업스케일할 수 있습니다!

- 프론트엔드: `https://your-project.vercel.app`
- 백엔드: 내 컴퓨터 (Cloudflare Tunnel로 보호됨)
- 비용: 거의 무료 (전기료만)
