
import React, { useState } from 'react';

interface HeaderProps {
    isKeySelected: boolean;
    onSelectKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isKeySelected, onSelectKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const manualSteps = [
        {
            icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z',
            title: '프롬프트 작성',
            description: '당신의 상상력을 펼쳐, 만들고 싶은 이미지에 대한 아이디어를 자유롭게 묘사하세요.',
        },
        {
            icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
            title: '이미지 주소 복사',
            description: "Midjourney에서 스타일 참조로 사용할 이미지 위에서 마우스 오른쪽 버튼을 클릭하여 '이미지 주소 복사'를 선택하세요.",
        },
        {
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            title: '스타일 참조에 붙여넣기',
            description: "복사한 URL을 '스타일 참조 URL' 필드에 붙여넣어 스타일을 주입하세요.",
        },
        {
            icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
            title: '이미지 생성',
            description: '‘이미지 생성’ 버튼을 클릭하여 당신만의 독창적인 예술 작품을 탄생시키세요.',
        },
    ];

    return (
        <>
            <header className="bg-slate-100/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                신화 AI 이미지 연구소
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={() => setIsModalOpen(true)}
                                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                aria-label="사용법 보기"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={onSelectKey}
                                className="relative p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                aria-label="API 키 설정"
                            >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-6 0a2 2 0 002 2h2a2 2 0 002-2m-6 0a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 00-2-2H9a2 2 0 00-2 2m0-10V7a2 2 0 012-2h2a2 2 0 012 2v2m0 4h.01M15 7h.01" />
                                </svg>
                                {!isKeySelected && (
                                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-5 sm:px-8 sm:py-6">
                            <div className="flex items-start justify-between">
                                <h2 className="text-xl font-bold text-slate-900">작업 순서 매뉴얼</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-6">
                                <ul className="space-y-5">
                                    {manualSteps.map((step, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold text-lg">
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-base font-medium text-slate-900">{step.title}</h3>
                                                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div className="mt-6 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500">
                                    - 이 솔루션은 Midjourney의 비공식 Discord 통신 구조를 기반으로 작동하되,
                                    Discord의 서비스 약관 변경이나 기술적 제약으로 인한 불안정을 최소화하기 위해 독자적인 알고리즘과 안정화 프로토콜을 적용했습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
