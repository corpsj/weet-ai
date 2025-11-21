# 로그 관리 가이드

이 프로젝트는 자동 로그 수집 및 에러 모니터링 시스템을 갖추고 있습니다.

## 로그 파일들

### 1. `dev-server.log`
- 개발 서버의 모든 출력 (stdout, stderr)
- 실시간으로 업데이트됨
- 컴파일 에러, 런타임 에러, 경고 등 포함

### 2. `npm-install.log`
- npm install 실행 결과
- 패키지 설치 중 발생한 경고 및 에러

### 3. `error.log`
- 자동으로 감지된 에러만 모음
- monitor-logs.sh 실행 시 생성됨

### 4. `runtime.log`
- 로그 모니터링 시스템 자체의 로그
- monitor-logs.sh 실행 시 생성됨

## 유틸리티 스크립트

### 에러 확인
```bash
./check-errors.sh
```
- 최근 에러 20개 표시
- 총 에러 개수 카운트
- 마지막 10개 에러 상세 표시

### 라이브 로그 모니터링
```bash
./monitor-logs.sh
```
- 실시간으로 dev-server.log 모니터링
- 에러 자동 감지 및 error.log에 저장
- Ctrl+C로 종료

### 간단한 로그 확인
```bash
# 최근 20줄 보기
tail -20 dev-server.log

# 실시간 로그 보기
tail -f dev-server.log

# 에러만 필터링해서 보기
grep -i error dev-server.log
```

## 개발 서버 관리

### 서버 시작 (백그라운드)
```bash
npm run dev > dev-server.log 2>&1 &
echo $! > .dev-server.pid
```

### 서버 상태 확인
```bash
if [ -f .dev-server.pid ]; then
    PID=$(cat .dev-server.pid)
    if ps -p $PID > /dev/null; then
        echo "✅ Dev server is running (PID: $PID)"
    else
        echo "❌ Dev server is not running"
    fi
else
    echo "❌ No PID file found"
fi
```

### 서버 종료
```bash
if [ -f .dev-server.pid ]; then
    kill $(cat .dev-server.pid)
    rm .dev-server.pid
    echo "✅ Dev server stopped"
fi
```

### 서버 재시작
```bash
# 종료
if [ -f .dev-server.pid ]; then kill $(cat .dev-server.pid); rm .dev-server.pid; fi

# 시작
npm run dev > dev-server.log 2>&1 &
echo $! > .dev-server.pid
echo "✅ Dev server restarted (PID: $(cat .dev-server.pid))"
```

## 자동 에러 감지 패턴

monitor-logs.sh는 다음 패턴을 자동으로 감지합니다:
- `error`
- `exception`
- `failed`
- `cannot`
- `undefined`
- `warning`

## 로그 정리

```bash
# 모든 로그 삭제
rm -f *.log

# 특정 로그만 삭제
rm -f error.log        # 에러 로그만
rm -f dev-server.log   # 개발 서버 로그만
```

## 문제 해결

### 1. 포트가 이미 사용 중
```bash
# 포트 3000을 사용하는 프로세스 찾기
lsof -ti:3000

# 해당 프로세스 종료
kill -9 $(lsof -ti:3000)
```

### 2. 로그 파일이 너무 큼
```bash
# 로그 파일 크기 확인
ls -lh *.log

# 로그 파일 압축 및 백업
tar -czf logs-backup-$(date +%Y%m%d-%H%M%S).tar.gz *.log
rm -f *.log
```

### 3. 에러 로그 분석
```bash
# 가장 많이 발생한 에러 찾기
grep -oE "Error:.*" error.log | sort | uniq -c | sort -rn

# 특정 에러만 찾기
grep "TypeError" error.log

# 시간대별 에러 개수
grep -oE "\[.*\]" error.log | cut -d' ' -f1 | sort | uniq -c
```

## Claude에게 에러 수정 요청하기

에러가 발생하면 다음과 같이 요청하세요:

```
에러를 수정해줘
```

Claude는 자동으로:
1. `dev-server.log` 확인
2. `error.log` 확인 (있는 경우)
3. 에러 분석
4. 코드 수정
5. 필요시 서버 재시작

## 유용한 명령어 모음

```bash
# 개발 환경 전체 상태 확인
echo "=== Dev Server Status ===" && \
if [ -f .dev-server.pid ]; then ps -p $(cat .dev-server.pid) > /dev/null && echo "✅ Running" || echo "❌ Not running"; else echo "❌ No PID"; fi && \
echo "" && \
echo "=== Recent Errors ===" && \
./check-errors.sh

# 로그 실시간 모니터링 (컬러)
tail -f dev-server.log | grep --color=always -E 'error|warning|$'

# 빌드 에러만 추출
grep -A 5 "Failed to compile" dev-server.log

# 런타임 에러만 추출
grep -A 5 "Runtime" dev-server.log
```

## .gitignore 설정

다음 파일들은 git에 커밋되지 않습니다:
```
*.log
.dev-server.pid
```

## 참고사항

- 로그 파일은 자동으로 `.gitignore`에 포함되어 있습니다
- 개발 서버는 파일 변경 시 자동으로 재시작됩니다
- 에러가 발생하면 브라우저 콘솔과 터미널 로그를 모두 확인하세요
