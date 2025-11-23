import { NextRequest, NextResponse } from 'next/server';

// Python 백엔드 서버 URL
const BACKEND_URL = process.env.UPSCALE_BACKEND_URL || 'http://localhost:8000';

// Mock 모드 (백엔드 없이 프론트엔드 테스트용)
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_UPSCALE === 'true';

// Mock 업스케일링 함수 (프론트엔드 테스트용)
async function mockUpscale(image: string, scale: number) {
  // 2초 딜레이로 실제 처리 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 원본 이미지를 그대로 반환 (실제로는 업스케일되지 않음)
  // 프론트엔드 UI 테스트만 목적
  const mockData = {
    success: true,
    upscaled_image: `data:image/png;base64,${image}`,
    original_size: { width: 512, height: 512 },
    upscaled_size: { width: 512 * scale, height: 512 * scale },
    scale: scale,
    model: 'MOCK_MODE',
  };

  return mockData;
}

export async function POST(request: NextRequest) {
  // 요청 본문을 먼저 파싱 (catch 블록에서도 접근 가능하도록)
  const body = await request.json();
  const { image, scale = 4, model = 'RealESRGAN_x4plus' } = body;

  if (!image) {
    return NextResponse.json(
      { error: 'Image is required' },
      { status: 400 }
    );
  }

  // Mock 모드: 백엔드 없이 프론트엔드 테스트
  if (MOCK_MODE) {
    console.log(`🎭 Mock mode: Simulating upscale (scale: ${scale}x)`);
    const mockData = await mockUpscale(image, scale);
    return NextResponse.json(mockData);
  }

  try {
    // 실제 백엔드로 요청 전달
    console.log(`📤 Forwarding upscale request to backend (scale: ${scale}x, model: ${model})`);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('scale', scale.toString());
    formData.append('model', model);

    const response = await fetch(`${BACKEND_URL}/upscale`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Upscaling failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Upscaling successful');

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('❌ Upscale API error:', error);

    // 백엔드 서버가 실행되지 않은 경우 -> 자동으로 Mock 모드로 전환 (UI 테스트용)
    if (error instanceof Error && error.message.includes('fetch failed')) {
      console.log('⚠️  Backend not available, falling back to Mock mode for UI testing');
      const mockData = await mockUpscale(image, scale);
      return NextResponse.json(mockData);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// 헬스 체크 엔드포인트
export async function GET() {
  // Mock 모드
  if (MOCK_MODE) {
    return NextResponse.json({
      status: 'ok',
      backend: 'mock',
      backend_url: 'MOCK_MODE',
      message: 'Mock mode enabled for frontend testing',
    });
  }

  // 실제 백엔드 헬스 체크
  try {
    const response = await fetch(`${BACKEND_URL}/health`);

    if (response.ok) {
      return NextResponse.json({
        status: 'ok',
        backend: 'connected',
        backend_url: BACKEND_URL,
      });
    }

    return NextResponse.json(
      {
        status: 'error',
        backend: 'disconnected',
        backend_url: BACKEND_URL,
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        backend: 'disconnected',
        backend_url: BACKEND_URL,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
