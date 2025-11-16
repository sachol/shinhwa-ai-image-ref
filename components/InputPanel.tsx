import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Spinner } from './Spinner';

interface InputPanelProps {
    prompt: string;
    setPrompt: (value: string) => void;
    srefUrl: string;
    setSrefUrl: (value: string) => void;
    aspectRatio: string;
    setAspectRatio: (value: string) => void;
    isLoading: boolean;
    error: string | null;
    handleSubmit: (e: React.FormEvent) => void;
    isKeySelected: boolean;
    onSelectKey: () => Promise<void>;
    onKeyInvalid: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
    prompt,
    setPrompt,
    srefUrl,
    setSrefUrl,
    aspectRatio,
    setAspectRatio,
    isLoading,
    error,
    handleSubmit,
    isKeySelected,
    onSelectKey,
    onKeyInvalid,
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [debouncedSrefUrl, setDebouncedSrefUrl] = useState<string>('');
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [isPreviewError, setIsPreviewError] = useState<boolean>(false);

    useEffect(() => {
        const handler = setTimeout(() => {
             // Basic validation
            if (srefUrl && (srefUrl.startsWith('http://') || srefUrl.startsWith('https://'))) {
                try {
                    new URL(srefUrl); // More robust validation
                    setDebouncedSrefUrl(srefUrl);
                    setIsPreviewLoading(true);
                    setIsPreviewError(false);
                } catch (_) {
                    // Invalid URL format
                    setDebouncedSrefUrl('');
                }
            } else {
                 setDebouncedSrefUrl('');
            }
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [srefUrl]);

    const handleGenerateSuggestions = async () => {
        setSuggestionError(null);
        let hasKey = isKeySelected;

        if (!hasKey) {
            try {
                await onSelectKey();
                hasKey = true;
            } catch (e) {
                setSuggestionError("API 키 선택이 취소되었거나 실패했습니다.");
                return;
            }
        }
        
        setIsGeneratingSuggestions(true);
        setSuggestions([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
               model: "gemini-2.5-flash",
               contents: "다양한 주제(판타지, 공상과학, 추상미술, 자연 풍경, 일상 생활)를 아우르는 독창적이고 창의적인 이미지 생성 프롬프트 5개를 추천해줘. 반드시 한국어로 답변하고, JSON 문자열 배열 형식으로만 제공해줘. 예: [\"프롬프트 1\", \"프롬프트 2\"]",
               config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                      description: "추천 프롬프트 문장"
                    },
                  },
               },
            });
            
            const parsedSuggestions = JSON.parse(response.text);
            if (Array.isArray(parsedSuggestions) && parsedSuggestions.every(item => typeof item === 'string')) {
                 setSuggestions(parsedSuggestions);
            } else {
                throw new Error("API가 유효한 형식의 추천을 반환하지 않았습니다.");
            }
           
        } catch (err) {
            console.error("Failed to generate prompt suggestions:", err);
            if (err instanceof Error && (err.message.includes('API key not valid') || err.message.includes('Requested entity was not found'))) {
                setSuggestionError('API 키가 유효하지 않습니다. 다른 프로젝트를 선택해주세요.');
                onKeyInvalid();
            } else {
                setSuggestionError("추천 프롬프트를 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
            }
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full">
            <div className="flex-grow">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-1">
                                프롬프트 (Prompt)
                            </label>
                            <textarea
                                id="prompt"
                                name="prompt"
                                rows={4}
                                className="w-full px-3 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                placeholder="생성하고 싶은 이미지의 주제를 입력하세요 (예: 눈이 큰 고양이)"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <div className="mt-2 flex items-center">
                                <button
                                    type="button"
                                    onClick={handleGenerateSuggestions}
                                    disabled={isGeneratingSuggestions || isLoading}
                                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGeneratingSuggestions ? (
                                        <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    )}
                                    <span>랜덤 프롬프트 추천</span>
                                </button>
                            </div>
                            {suggestions.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs text-slate-500">마음에 드는 프롬프트를 클릭하여 사용하세요:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPrompt(s)}
                                                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {suggestionError && (
                                <div className="mt-2 text-xs text-red-600">{suggestionError}</div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="sref" className="block text-sm font-medium text-slate-700 mb-1">
                                스타일 참조 URL (Sref URL)
                            </label>
                            <input
                                type="url"
                                id="sref"
                                name="sref"
                                className="w-full px-3 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                placeholder="https://cdn.midjourney.com/..."
                                value={srefUrl}
                                onChange={(e) => setSrefUrl(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        
                        {debouncedSrefUrl && (
                            <div className="mt-1">
                                <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                                    {isPreviewLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <Spinner />
                                        </div>
                                    )}
                                    {isPreviewError && !isPreviewLoading && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm font-medium text-red-700">이미지 로드 실패</p>
                                            <p className="text-xs text-red-600 mt-1">URL을 확인하거나 다른 이미지를 사용해주세요.</p>
                                        </div>
                                    )}
                                    <img
                                        src={debouncedSrefUrl}
                                        alt="스타일 참조 미리보기"
                                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isPreviewLoading || isPreviewError ? 'opacity-0' : 'opacity-100'}`}
                                        onLoad={() => setIsPreviewLoading(false)}
                                        onError={() => {
                                            setIsPreviewLoading(false);
                                            setIsPreviewError(true);
                                        }}
                                        style={{ display: isPreviewError ? 'none' : 'block' }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-slate-700 mb-1">
                                프레임 비율 (Aspect Ratio)
                            </label>
                            <select
                                id="aspect-ratio"
                                name="aspect-ratio"
                                className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="1:1">1:1 (정방형)</option>
                                <option value="16:9">16:9 (와이드 가로)</option>
                                <option value="9:16">9:16 (와이드 세로)</option>
                                <option value="4:3">4:3 (가로)</option>
                                <option value="3:4">3:4 (세로)</option>
                                <option value="3:2">3:2 (가로)</option>
                                <option value="2:3">2:3 (세로)</option>
                            </select>
                        </div>
                    </div>

                    {error && !isLoading && (
                        <div className="mt-6 p-3 bg-red-100 border border-red-200 text-red-800 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {'이미지 생성 중...'}
                                </>
                            ) : '이미지 생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
