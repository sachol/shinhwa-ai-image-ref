import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

interface OutputPanelProps {
    generatedImageUrl: string | null;
    isLoading: boolean;
    isEditing: boolean;
    onReset: () => void;
    error: string | null;
    aspectRatio: string;
    onEditImage: (editPrompt: string, uploadedImageBlob: Blob) => Promise<void>;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ generatedImageUrl, isLoading, isEditing, onReset, error, aspectRatio, onEditImage }) => {
    const [editPrompt, setEditPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            if (uploadedImage) {
                URL.revokeObjectURL(uploadedImage.previewUrl);
            }
            setUploadedImage({
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }
    };

    const handleApplyEdit = async () => {
        if (uploadedImage && editPrompt) {
            await onEditImage(editPrompt, uploadedImage.file);
        }
    };

    useEffect(() => {
        return () => {
            if (uploadedImage) {
                URL.revokeObjectURL(uploadedImage.previewUrl);
            }
        };
    }, [uploadedImage]);
    
    useEffect(() => {
        setEditPrompt('');
        setUploadedImage(null);
    }, [generatedImageUrl]);

    const handleDownload = () => {
        if (!generatedImageUrl) return;

        const link = document.createElement('a');
        link.href = generatedImageUrl;

        const mimeType = generatedImageUrl.split(';')[0].split(':')[1];
        const extension = mimeType ? mimeType.split('/')[1] : 'png';
        
        link.download = `generated-image-${Date.now()}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Spinner />
                    <p className="text-lg font-semibold text-slate-700 mt-4">이미지를 생성 중입니다...</p>
                    <p className="text-sm text-slate-500 mt-2">시간이 걸릴 수 있습니다. 잠시만 기다려 주세요.</p>
                </div>
            );
        }

        if (error && !isEditing) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-600 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold mt-4 text-red-700">생성 실패</p>
                    <p className="text-sm text-red-500 mt-2 max-w-sm">오류가 발생했습니다. 다시 시도해 주세요.</p>
                     <button 
                        onClick={onReset}
                        className="mt-6 py-2 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        다시 시도
                    </button>
                </div>
            );
        }

        if (generatedImageUrl) {
            return (
                <div className="flex flex-col items-center text-center w-full h-full justify-between">
                    <div className="w-full flex-1 flex items-center justify-center overflow-hidden min-h-0 mb-4">
                        <img 
                            src={generatedImageUrl} 
                            alt="생성된 이미지"
                            className="block max-w-full max-h-full object-contain rounded-xl shadow-lg transition-opacity duration-500 opacity-0 animate-fade-in"
                            style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}
                        />
                    </div>

                    <div className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <h3 className="text-base font-semibold text-slate-800 text-left">이미지 합성/편집</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="image-upload" className="block text-sm font-medium text-slate-700 mb-2 text-left">1. 이미지 불러오기</label>
                                <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center relative hover:border-indigo-500 transition-colors">
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleImageUpload}
                                        disabled={isLoading || isEditing}
                                    />
                                    {uploadedImage ? (
                                        <img src={uploadedImage.previewUrl} alt="업로드 미리보기" className="max-w-full max-h-full object-contain rounded" />
                                    ) : (
                                        <div className="text-center text-slate-500 p-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            <p className="mt-1 text-xs">여기를 클릭하여 파일 선택</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="edit-prompt" className="block text-sm font-medium text-slate-700 mb-2 text-left">2. 합성/편집 명령 입력</label>
                                <textarea
                                    id="edit-prompt"
                                    rows={4}
                                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    placeholder="예: 이 캐릭터를 생성된 이미지의 오른쪽에 추가해줘"
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    disabled={isLoading || isEditing}
                                />
                            </div>
                        </div>
                         <button
                            onClick={handleApplyEdit}
                            disabled={!uploadedImage || !editPrompt.trim() || isEditing}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isEditing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {'편집 적용 중...'}
                                </>
                            ) : '편집 적용하기'}
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full flex-shrink-0">
                        <button 
                            onClick={onReset}
                            className="w-full sm:w-auto py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            다른 이미지 만들기
                        </button>
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto py-2.5 px-6 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            다운로드
                        </button>
                    </div>
                     <style>{`
                        @keyframes fade-in {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        .animate-fade-in {
                            animation: fade-in 0.5s ease-in-out forwards;
                        }
                    `}</style>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <div className="w-24 h-24 text-slate-300 mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 00-4.137 1.625M9.75 3.104c2.512 0 4.726.92 6.375 2.502m-6.375-2.502c2.188.348 4.232.964 6.09 1.882M15 5.25a24.301 24.301 0 01-4.137 1.625m4.137-1.625c2.188.348 4.232.964 6.09 1.882m-12.467 9.382c.966.33 1.997.546 3.067.652m-3.067-.652c-2.188-.348-4.232-.964-6.09-1.882M15 20.25a24.301 24.301 0 01-4.137-1.625m4.137 1.625c2.188-.348 4.232-.964 6.09-1.882M5 14.5c.966.33 1.997.546 3.067.652m-3.067-.652c-2.188-.348-4.232-.964-6.09-1.882" />
                    </svg>
                </div>
                <p className="text-xl font-semibold text-slate-700">당신의 걸작을 기다립니다</p>
                <p className="text-sm text-slate-500 mt-1">왼쪽 패널에서 프롬프트를 입력하여 마법을 시작하세요.</p>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 min-h-[500px] h-full flex flex-col items-center justify-center">
            {renderContent()}
        </div>
    );
};