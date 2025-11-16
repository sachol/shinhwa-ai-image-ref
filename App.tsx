
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { GoogleGenAI, Modality } from '@google/genai';

// FIX: The original inline type for `window.aistudio` was causing a conflict with an existing global declaration. 
// Based on the TypeScript error, a named `AIStudio` interface is expected. This change defines that interface
// and applies it to `window.aistudio` to resolve the conflict through proper declaration merging.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        // FIX: Made the 'aistudio' property on the Window interface optional to resolve a TypeScript error. This aligns with the code's runtime checks for its existence.
        aistudio?: AIStudio;
    }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            if (!base64String) {
                reject(new Error("Failed to convert blob to base64"));
            } else {
                resolve(base64String);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const fetchImageWithFallback = async (url: string): Promise<Blob> => {
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    let lastError: Error | null = null;

    for (const proxyUrl of proxies) {
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                     throw new Error(`참조 이미지를 찾을 수 없습니다 (서버 응답: ${response.status}). URL을 확인해주세요.`);
                }
                throw new Error(`프록시 서버 오류 (상태 코드: ${response.status})`);
            }
            const blob = await response.blob();
             if (!blob.type.startsWith('image/')) {
                throw new Error('참조 URL이 유효한 이미지 파일을 가리키지 않습니다. 이미지 파일의 직접 URL을 사용해주세요.');
            }
            return blob;
        } catch (error) {
            lastError = error as Error;
            console.warn(`Proxy failed: ${proxyUrl}. Trying next...`, error);
        }
    }
    
    throw new Error('모든 프록시 서버를 통해 참조 이미지를 가져오는 데 실패했습니다. 네트워크 연결을 확인하거나, 다른 이미지 URL을 시도해 보세요.');
};


const resizeImageToAspectRatio = (blob: Blob, aspectRatio: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        if (!widthRatio || !heightRatio) {
            return reject(new Error('Invalid aspect ratio format'));
        }
        const targetAspectRatio = widthRatio / heightRatio;

        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.src = url;

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            const originalWidth = img.width;
            const originalHeight = img.height;
            const MAX_DIMENSION = 1024;
            
            let scale = 1;
            if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
                scale = Math.min(MAX_DIMENSION / originalWidth, MAX_DIMENSION / originalHeight);
            }

            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;
            const scaledAspectRatio = scaledWidth / scaledHeight;

            let finalCanvasWidth: number;
            let finalCanvasHeight: number;
            let drawImageX = 0;
            let drawImageY = 0;

            if (scaledAspectRatio > targetAspectRatio) {
                // Image is wider than target AR. Pad top/bottom.
                finalCanvasWidth = scaledWidth;
                finalCanvasHeight = scaledWidth / targetAspectRatio;
                drawImageY = (finalCanvasHeight - scaledHeight) / 2;
            } else {
                // Image is taller than or equal to target AR. Pad left/right.
                finalCanvasHeight = scaledHeight;
                finalCanvasWidth = scaledHeight * targetAspectRatio;
                drawImageX = (finalCanvasWidth - scaledWidth) / 2;
            }

            canvas.width = finalCanvasWidth;
            canvas.height = finalCanvasHeight;

            ctx.fillStyle = '#FFFFFF'; // White background for padding
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, drawImageX, drawImageY, scaledWidth, scaledHeight);

            canvas.toBlob((resultBlob) => {
                if (resultBlob) {
                    resolve(resultBlob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            }, blob.type, 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for processing'));
        };
    });
};


const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [srefUrl, setSrefUrl] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setIsKeySelected(hasKey);
                } catch (e) {
                    console.error("Error checking for API key:", e);
                }
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        // FIX: Add a guard to prevent runtime errors if window.aistudio is not available.
        if (!window.aistudio) {
            setError("API key selection is not available in this environment.");
            return;
        }
        try {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        } catch (e) {
            console.error("Failed to open key selector:", e);
            setError("API 키 선택이 취소되었거나 실패했습니다.");
        }
    };
    
    const handleKeyInvalid = () => {
        setIsKeySelected(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let hasKey = isKeySelected;
        if (!hasKey) {
            // FIX: Add a guard to prevent runtime errors if window.aistudio is not available.
            if (!window.aistudio) {
                setError("API key selection is not available in this environment.");
                return;
            }
             try {
                await window.aistudio.openSelectKey();
                setIsKeySelected(true);
                hasKey = true;
            } catch (e) {
                setError("API 키 선택이 취소되었거나 실패했습니다. 키를 선택한 후 다시 시도해주세요.");
                return;
            }
        }
        
        if (!prompt || !srefUrl) {
            setError('프롬프트와 Sref URL 모두 필요합니다.');
            return;
        }
        
        try {
            new URL(srefUrl);
        } catch (_) {
            setError('유효하지 않은 URL 형식입니다. http:// 또는 https:// 로 시작하는 전체 주소를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setGeneratedImageUrl(null);

        try {
            const originalBlob = await fetchImageWithFallback(srefUrl);
            const processedBlob = await resizeImageToAspectRatio(originalBlob, aspectRatio);
            const base64Data = await blobToBase64(processedBlob);
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const imagePart = {
                inlineData: {
                    mimeType: processedBlob.type,
                    data: base64Data,
                },
            };
            
            const textPart = {
                text: `Generate an image of '${prompt}', using the artistic style of the provided image. The generated image must not contain any text, words, or letters.`
            };

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const firstCandidate = result?.candidates?.[0];

            if (!firstCandidate?.content?.parts) {
                if (result.promptFeedback?.blockReason) {
                    const reason = result.promptFeedback.blockReason;
                    const details = result.promptFeedback.blockReasonMessage;
                    let errorMessage = `생성이 안전상의 이유로 차단되었습니다. (이유: ${reason})`;
                    if (details) {
                        errorMessage += `: ${details}`;
                    }
                    throw new Error(errorMessage);
                }
                throw new Error("API 응답에서 유효한 생성 후보를 찾을 수 없습니다. 프롬프트를 수정하거나 다시 시도해 주세요.");
            }

            let foundImage = false;
            for (const part of firstCandidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    setGeneratedImageUrl(imageUrl);
                    foundImage = true;
                    break; 
                }
            }

            if (!foundImage) {
                 throw new Error("API 응답에 이미지가 포함되어 있지 않습니다.");
            }

        } catch (err) {
            console.error('Failed to generate image:', err);
            let message = '알 수 없는 오류가 발생했습니다.';
            if (err instanceof Error) {
                if (err.message.includes('API key not valid') || err.message.includes('Requested entity was not found')) {
                    message = 'API 키가 유효하지 않습니다. 다른 프로젝트를 선택하거나 새 키를 생성해주세요.';
                    handleKeyInvalid();
                } else {
                    message = err.message;
                }
            }
            setError(`이미지 생성 중 오류가 발생했습니다: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditImage = async (editPrompt: string, uploadedImageBlob: Blob) => {
        if (!generatedImageUrl) {
            setError('편집할 원본 이미지가 없습니다.');
            return;
        }
        
        setIsEditing(true);
        setError(null);

        try {
            const originalImageResponse = await fetch(generatedImageUrl);
            if (!originalImageResponse.ok) throw new Error('원본 이미지를 다시 불러오는 데 실패했습니다.');
            const originalImageBlob = await originalImageResponse.blob();
            const originalImageBase64 = await blobToBase64(originalImageBlob);
            
            const uploadedImageBase64 = await blobToBase64(uploadedImageBlob);

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const originalImagePart = {
                inlineData: { mimeType: originalImageBlob.type, data: originalImageBase64 },
            };
            const uploadedImagePart = {
                inlineData: { mimeType: uploadedImageBlob.type, data: uploadedImageBase64 },
            };
            const textPart = { text: editPrompt };

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [originalImagePart, uploadedImagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const firstCandidate = result?.candidates?.[0];

            if (!firstCandidate?.content?.parts) {
                if (result.promptFeedback?.blockReason) {
                    const reason = result.promptFeedback.blockReason;
                    const details = result.promptFeedback.blockReasonMessage;
                    let errorMessage = `생성이 안전상의 이유로 차단되었습니다. (이유: ${reason})`;
                    if (details) {
                        errorMessage += `: ${details}`;
                    }
                    throw new Error(errorMessage);
                }
                throw new Error("API 응답에서 유효한 생성 후보를 찾을 수 없습니다. 프롬프트를 수정하거나 다시 시도해 주세요.");
            }

            let foundImage = false;
            for (const part of firstCandidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    setGeneratedImageUrl(imageUrl);
                    foundImage = true;
                    break;
                }
            }

            if (!foundImage) {
                 throw new Error("API 응답에 이미지가 포함되어 있지 않습니다.");
            }

        } catch (err) {
            console.error('Failed to edit image:', err);
            let message = '알 수 없는 오류가 발생했습니다.';
            if (err instanceof Error) {
                if (err.message.includes('API key not valid') || err.message.includes('Requested entity was not found')) {
                    message = 'API 키가 유효하지 않습니다. 다른 프로젝트를 선택하거나 새 키를 생성해주세요.';
                    handleKeyInvalid();
                } else {
                    message = err.message;
                }
            }
            setError(`이미지 편집 중 오류가 발생했습니다: ${message}`);
        } finally {
            setIsEditing(false);
        }
    };
    
    const handleReset = () => {
        setPrompt('');
        setSrefUrl('');
        setGeneratedImageUrl(null);
        setIsLoading(false);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
            <Header isKeySelected={isKeySelected} onSelectKey={handleSelectKey} />
            <main className="p-4 sm:p-6 lg:p-8 flex-grow">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <InputPanel
                            prompt={prompt}
                            setPrompt={setPrompt}
                            srefUrl={srefUrl}
                            setSrefUrl={setSrefUrl}
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                            isLoading={isLoading || isEditing}
                            error={error}
                            handleSubmit={handleSubmit}
                            isKeySelected={isKeySelected}
                            onSelectKey={handleSelectKey}
                            onKeyInvalid={handleKeyInvalid}
                        />
                        <div className="lg:col-span-2">
                            <OutputPanel
                                generatedImageUrl={generatedImageUrl}
                                isLoading={isLoading}
                                isEditing={isEditing}
                                error={error}
                                onReset={handleReset}
                                aspectRatio={aspectRatio}
                                onEditImage={handleEditImage}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <footer className="text-center p-4 text-sm text-slate-500">
                © 2024 신화AI부동산. All Rights Reserved.
            </footer>
        </div>
    );
};

export default App;
