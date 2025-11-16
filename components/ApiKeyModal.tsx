
import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    currentKey: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
    const [key, setKey] = useState('');

    useEffect(() => {
        if (currentKey) {
            setKey(currentKey);
        } else {
            setKey('');
        }
    }, [currentKey, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (key.trim()) {
            onSave(key.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" 
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'fade-in-scale 0.3s forwards' }}
            >
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold text-gray-900">API 키 설정</h2>
                        <button 
                            onClick={onClose} 
                            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            aria-label="닫기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        이미지 생성을 위해 Gemini API 키를 입력해주세요. 키는 브라우저에 안전하게 저장됩니다.
                        {' '}
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-medium text-indigo-600 hover:underline"
                        >
                            여기서
                        </a>
                        {' '}키를 발급받을 수 있습니다.
                    </p>
                    <div className="mt-4">
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 sr-only">Gemini API Key</label>
                        <input
                            type="password"
                            id="api-key"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="API 키를 여기에 붙여넣으세요"
                            autoComplete="off"
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            취소
                        </button>
                        <button 
                            onClick={handleSave} 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors" 
                            disabled={!key.trim()}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};
