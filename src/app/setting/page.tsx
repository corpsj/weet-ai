'use client';

import { useState, useEffect } from 'react';
import { SettingSection } from '@/components/ui/SettingSection';
import { Key, Database, Info, Save, Trash2, AlertTriangle, Check, Loader2, TestTube, Globe, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingPage() {
    const [apiKey, setApiKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [storageSize, setStorageSize] = useState<string>('0 KB');

    // API key testing
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [keyTestResult, setKeyTestResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [keyTestMessage, setKeyTestMessage] = useState('');

    // Backend URL configuration
    const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
    const [isTestingBackend, setIsTestingBackend] = useState(false);
    const [backendTestResult, setBackendTestResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [backendTestMessage, setBackendTestMessage] = useState('');

    // Auto-save toggle
    const [autoSaveImages, setAutoSaveImages] = useState(false);

    useEffect(() => {
        // Load saved API key
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }

        // Load backend URL
        const savedBackendUrl = localStorage.getItem('upscale_backend_url');
        if (savedBackendUrl) {
            setBackendUrl(savedBackendUrl);
        }

        // Load auto-save setting
        const savedAutoSave = localStorage.getItem('auto_save_images');
        setAutoSaveImages(savedAutoSave === 'true');

        // Calculate storage usage
        calculateStorageUsage();
    }, []);

    const calculateStorageUsage = () => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) total += value.length * 2; // Approximate size in bytes
            }
        }

        if (total > 1024 * 1024) {
            setStorageSize(`${(total / (1024 * 1024)).toFixed(2)} MB`);
        } else {
            setStorageSize(`${(total / 1024).toFixed(2)} KB`);
        }
    };

    const handleSaveKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleTestApiKey = async () => {
        if (!apiKey || !apiKey.trim()) {
            setKeyTestResult('error');
            setKeyTestMessage('API 키를 입력해주세요.');
            return;
        }

        setIsTestingKey(true);
        setKeyTestResult('idle');
        setKeyTestMessage('');

        try {
            // Test with a minimal Gemini API request
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: 'test' }]
                        }],
                        generationConfig: {
                            responseModalities: ['TEXT'],
                            temperature: 1.0,
                        }
                    })
                }
            );

            if (response.ok) {
                setKeyTestResult('success');
                setKeyTestMessage('✓ API 키가 유효합니다!');
                // Auto-save if test succeeds
                localStorage.setItem('gemini_api_key', apiKey);
            } else {
                await response.json().catch(() => ({}));
                setKeyTestResult('error');
                setKeyTestMessage(`✗ API 키가 유효하지 않습니다. (${response.status})`);
            }
        } catch (error) {
            setKeyTestResult('error');
            setKeyTestMessage('✗ 연결 오류가 발생했습니다.');
        } finally {
            setIsTestingKey(false);
            setTimeout(() => {
                setKeyTestResult('idle');
                setKeyTestMessage('');
            }, 5000);
        }
    };

    const handleSaveBackendUrl = () => {
        localStorage.setItem('upscale_backend_url', backendUrl);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleTestBackend = async () => {
        if (!backendUrl || !backendUrl.trim()) {
            setBackendTestResult('error');
            setBackendTestMessage('백엔드 URL을 입력해주세요.');
            return;
        }

        setIsTestingBackend(true);
        setBackendTestResult('idle');
        setBackendTestMessage('');

        try {
            // Test health endpoint
            const response = await fetch('/api/upscale', {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.backend === 'connected') {
                    setBackendTestResult('success');
                    setBackendTestMessage('✓ 백엔드 서버에 연결되었습니다!');
                } else if (data.backend === 'mock') {
                    setBackendTestResult('success');
                    setBackendTestMessage('✓ Mock 모드로 실행 중입니다.');
                } else {
                    setBackendTestResult('error');
                    setBackendTestMessage('✗ 백엔드 서버에 연결할 수 없습니다.');
                }
                // Auto-save if test succeeds
                localStorage.setItem('upscale_backend_url', backendUrl);
            } else {
                setBackendTestResult('error');
                setBackendTestMessage('✗ 백엔드 서버 응답 오류');
            }
        } catch (error) {
            setBackendTestResult('error');
            setBackendTestMessage('✗ 연결 오류가 발생했습니다.');
        } finally {
            setIsTestingBackend(false);
            setTimeout(() => {
                setBackendTestResult('idle');
                setBackendTestMessage('');
            }, 5000);
        }
    };

    const handleToggleAutoSave = () => {
        const newValue = !autoSaveImages;
        setAutoSaveImages(newValue);
        localStorage.setItem('auto_save_images', newValue.toString());
    };

    const handleClearStorage = () => {
        if (window.confirm('모든 데이터(이미지, 설정, 히스토리)가 삭제됩니다. 계속하시겠습니까?')) {
            const currentKey = localStorage.getItem('gemini_api_key');
            const currentBackendUrl = localStorage.getItem('upscale_backend_url');
            const currentAutoSave = localStorage.getItem('auto_save_images');

            localStorage.clear();

            // Restore important settings
            if (currentKey) {
                localStorage.setItem('gemini_api_key', currentKey);
            }
            if (currentBackendUrl) {
                localStorage.setItem('upscale_backend_url', currentBackendUrl);
            }
            if (currentAutoSave) {
                localStorage.setItem('auto_save_images', currentAutoSave);
            }

            calculateStorageUsage();
            alert('초기화되었습니다. (설정은 유지됩니다)');
            window.location.reload();
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-zinc-950 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-100">설정</h1>
                    <p className="text-zinc-400 mt-2">애플리케이션 환경설정 및 데이터 관리</p>
                </header>

                {/* API Configuration */}
                <SettingSection
                    title="API 설정"
                    description="Gemini API 키를 설정하여 이미지 생성 기능을 사용합니다."
                >
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Gemini API Key
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={isKeyVisible ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsKeyVisible(!isKeyVisible)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                                    >
                                        {isKeyVisible ? "숨기기" : "보기"}
                                    </button>
                                </div>
                                <button
                                    onClick={handleSaveKey}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all",
                                        isSaved
                                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                            : "bg-blue-600 hover:bg-blue-500 text-white"
                                    )}
                                >
                                    {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {isSaved ? "저장됨" : "저장"}
                                </button>
                            </div>

                            {/* API Key Test Button */}
                            <button
                                onClick={handleTestApiKey}
                                disabled={isTestingKey}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                    isTestingKey
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        : keyTestResult === 'success'
                                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                        : keyTestResult === 'error'
                                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                                )}
                            >
                                {isTestingKey ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        테스트 중...
                                    </>
                                ) : (
                                    <>
                                        <TestTube className="w-4 h-4" />
                                        API 키 테스트
                                    </>
                                )}
                            </button>

                            {keyTestMessage && (
                                <p className={cn(
                                    "text-sm flex items-center gap-2",
                                    keyTestResult === 'success' ? "text-green-400" : "text-red-400"
                                )}>
                                    {keyTestMessage}
                                </p>
                            )}

                            <p className="text-xs text-zinc-500">
                                API 키는 브라우저의 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.
                            </p>
                        </div>
                    </div>
                </SettingSection>

                {/* Backend Configuration */}
                <SettingSection
                    title="업스케일 백엔드 설정"
                    description="Real-ESRGAN 업스케일링 백엔드 서버 URL을 설정합니다."
                >
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Backend URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={backendUrl}
                                    onChange={(e) => setBackendUrl(e.target.value)}
                                    placeholder="http://localhost:8000"
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button
                                    onClick={handleSaveBackendUrl}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all",
                                        isSaved
                                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                            : "bg-blue-600 hover:bg-blue-500 text-white"
                                    )}
                                >
                                    {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {isSaved ? "저장됨" : "저장"}
                                </button>
                            </div>

                            {/* Backend Test Button */}
                            <button
                                onClick={handleTestBackend}
                                disabled={isTestingBackend}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                    isTestingBackend
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        : backendTestResult === 'success'
                                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                        : backendTestResult === 'error'
                                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                                )}
                            >
                                {isTestingBackend ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        연결 확인 중...
                                    </>
                                ) : (
                                    <>
                                        <TestTube className="w-4 h-4" />
                                        연결 테스트
                                    </>
                                )}
                            </button>

                            {backendTestMessage && (
                                <p className={cn(
                                    "text-sm flex items-center gap-2",
                                    backendTestResult === 'success' ? "text-green-400" : "text-red-400"
                                )}>
                                    {backendTestMessage}
                                </p>
                            )}

                            <p className="text-xs text-zinc-500">
                                로컬 개발: http://localhost:8000 | Cloudflare Tunnel 사용 시 공개 URL 입력
                            </p>
                        </div>
                    </div>
                </SettingSection>

                {/* Image Settings */}
                <SettingSection
                    title="이미지 설정"
                    description="이미지 저장 및 관리 옵션을 설정합니다."
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <div className="font-medium text-zinc-200">이미지 자동 저장</div>
                                    <div className="text-xs text-zinc-500">생성된 이미지를 자동으로 갤러리에 저장합니다</div>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleAutoSave}
                                className={cn(
                                    "relative w-14 h-7 rounded-full transition-colors",
                                    autoSaveImages ? "bg-blue-600" : "bg-zinc-700"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform",
                                        autoSaveImages && "translate-x-7"
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </SettingSection>

                {/* Data Management */}
                <SettingSection
                    title="데이터 관리"
                    description="로컬에 저장된 이미지와 설정을 관리합니다."
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <div className="font-medium text-zinc-200">저장소 사용량</div>
                                    <div className="text-xs text-zinc-500">{storageSize} 사용 중</div>
                                </div>
                            </div>
                            <button
                                onClick={handleClearStorage}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                전체 초기화
                            </button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>전체 초기화를 수행하면 갤러리의 모든 이미지와 작업 내역이 영구적으로 삭제됩니다. (설정은 유지됩니다)</p>
                        </div>
                    </div>
                </SettingSection>

                {/* About */}
                <SettingSection title="정보">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                            <Info className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-zinc-200">Weet AI Studio</h4>
                            <p className="text-sm text-zinc-500">Version 3.0.0 (Claude Edition)</p>
                        </div>
                    </div>
                </SettingSection>
            </div>
        </div>
    );
}
