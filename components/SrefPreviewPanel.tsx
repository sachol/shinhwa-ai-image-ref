import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

interface SrefPreviewPanelProps {
    srefUrl: string;
}

export const SrefPreviewPanel: React.FC<SrefPreviewPanelProps> = ({ srefUrl }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    
    const imageKey = srefUrl || 'empty';

    useEffect(() => {
        if (srefUrl) {
            setIsLoading(true);
            setIsError(false);
        }
    }, [srefUrl]);

    const renderContent = () => {
        if (!srefUrl) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                    <div className="w-24 h-24 text-slate-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </div>
                    <p className="text-xl font-semibold text-slate-700">스타일 참조 미리보기</p>
                    <p className="text-sm text-slate-500 mt-1">참조 URL을 입력하면 여기에 이미지가 표시됩니다.</p>
                </div>
            );
        }

        return (
            <div className="w-full h-full relative flex items-center justify-center">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <Spinner />
                    </div>
                )}
                {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-red-600 p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-semibold mt-4 text-red-700">로드 실패</p>
                        <p className="text-sm text-red-500 mt-2 max-w-sm">이미지를 불러올 수 없습니다. URL을 확인해주세요.</p>
                    </div>
                )}
                 <img
                    key={imageKey}
                    src={srefUrl}
                    alt="스타일 참조 미리보기"
                    className={`w-full h-full object-cover rounded-xl shadow-lg ${isLoading || isError ? 'opacity-0' : 'opacity-0 animate-fade-in'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setIsError(true);
                    }}
                />
            </div>
        );
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 min-h-[300px] xl:aspect-square flex items-center justify-center">
            {renderContent()}
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
};
