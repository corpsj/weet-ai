import React from 'react';
import { ChevronLeft, Zap, Sparkles, Aperture, Palette, Sun, Search, Ban, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdvancedSettingsProps {
    model: 'gemini-2.5-flash' | 'gemini-3-pro';
    setModel: (model: 'gemini-2.5-flash' | 'gemini-3-pro') => void;
    style: string;
    setStyle: (style: string) => void;
    lighting: string;
    setLighting: (lighting: string) => void;
    camera: string;
    setCamera: (camera: string) => void;
    mood: string;
    setMood: (mood: string) => void;
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;
    useGrounding: boolean;
    setUseGrounding: (use: boolean) => void;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export function AdvancedSettings({
    model,
    setModel,
    style,
    setStyle,
    lighting,
    setLighting,
    camera,
    setCamera,
    mood,
    setMood,
    negativePrompt,
    setNegativePrompt,
    useGrounding,
    setUseGrounding,
    isOpen,
    onClose,
    className
}: AdvancedSettingsProps) {
    const styles = [
        { value: '', label: '없음' },
        { value: 'Photorealistic', label: '실사 (Photorealistic)' },
        { value: 'Anime', label: '애니메이션 (Anime)' },
        { value: 'Digital Art', label: '디지털 아트 (Digital Art)' },
        { value: 'Oil Painting', label: '유화 (Oil Painting)' },
        { value: 'Sketch', label: '스케치 (Sketch)' },
        { value: '3D Render', label: '3D 렌더링 (3D Render)' },
        { value: 'Minimalist', label: '미니멀리즘 (Minimalist)' },
        { value: 'Vintage', label: '빈티지 (Vintage)' },
    ];

    const lightings = [
        { value: '', label: '없음' },
        { value: 'Studio', label: '스튜디오 (Studio)' },
        { value: 'Natural', label: '자연광 (Natural)' },
        { value: 'Golden Hour', label: '골든 아워 (Golden Hour)' },
        { value: 'Dramatic', label: '드라마틱 (Dramatic)' },
        { value: 'Neon', label: '네온 (Neon)' },
        { value: 'Cinematic', label: '시네마틱 (Cinematic)' },
    ];

    const cameras = [
        { value: '', label: '없음' },
        { value: 'Close-up', label: '클로즈업 (Close-up)' },
        { value: 'Wide Angle', label: '광각 (Wide Angle)' },
        { value: 'Macro', label: '매크로 (Macro)' },
        { value: 'Drone View', label: '드론 뷰 (Drone View)' },
        { value: 'Eye Level', label: '눈높이 (Eye Level)' },
        { value: 'Low Angle', label: '로우 앵글 (Low Angle)' },
    ];

    const moods = [
        { value: '', label: '없음' },
        { value: 'Serene', label: '평온함 (Serene)' },
        { value: 'Vibrant', label: '활기참 (Vibrant)' },
        { value: 'Dark', label: '어두움 (Dark)' },
        { value: 'Cheerful', label: '발랄함 (Cheerful)' },
        { value: 'Mysterious', label: '신비로움 (Mysterious)' },
        { value: 'Romantic', label: '로맨틱 (Romantic)' },
    ];

    if (!isOpen) return null;

    return (
        <div className={cn(
            "absolute top-0 left-full h-full w-80 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800 p-4 overflow-y-auto transition-all shadow-2xl z-50",
            className
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-bold text-zinc-100">고급 설정</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-zinc-400" />
                </button>
            </div>

            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
                {/* Model Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">모델</label>
                    <div className="flex bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setModel('gemini-2.5-flash')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all",
                                model === 'gemini-2.5-flash'
                                    ? "bg-zinc-700 text-blue-400 shadow-sm"
                                    : "text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Flash 2.5
                        </button>
                        <button
                            type="button"
                            onClick={() => setModel('gemini-3-pro')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all",
                                model === 'gemini-3-pro'
                                    ? "bg-zinc-700 text-purple-400 shadow-sm"
                                    : "text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            <Crown className="w-3.5 h-3.5" />
                            Pro 3.0
                        </button>
                    </div>
                </div>

                {/* Enhancers Grid */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Palette className="w-3 h-3" /> 스타일
                        </label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                            {styles.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Sun className="w-3 h-3" /> 조명
                        </label>
                        <select
                            value={lighting}
                            onChange={(e) => setLighting(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                            {lightings.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Aperture className="w-3 h-3" /> 카메라
                        </label>
                        <select
                            value={camera}
                            onChange={(e) => setCamera(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                            {cameras.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 분위기
                        </label>
                        <select
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        >
                            {moods.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Negative Prompt */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Ban className="w-3 h-3" /> 부정 프롬프트
                    </label>
                    <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="이미지에서 제외할 요소를 입력하세요..."
                        className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
                    />
                </div>

                {/* Grounding (Pro only) */}
                <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    model === 'gemini-3-pro'
                        ? "bg-zinc-800 border-zinc-700"
                        : "bg-zinc-800/50 border-zinc-800 opacity-50 cursor-not-allowed"
                )}>
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-zinc-200">Google 그라운딩</span>
                            <span className="text-[10px] text-zinc-500">실시간 데이터 사용</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => model === 'gemini-3-pro' && setUseGrounding(!useGrounding)}
                        disabled={model !== 'gemini-3-pro'}
                        className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            useGrounding ? "bg-blue-500" : "bg-zinc-600"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform",
                            useGrounding ? "translate-x-5" : "translate-x-0"
                        )} />
                    </button>
                </div>
            </div>
        </div>
    );
}
