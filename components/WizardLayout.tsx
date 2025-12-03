import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface WizardLayoutProps {
    title: string;
    subtitle?: string;
    progress: number;
    children: React.ReactNode;
    onBack?: () => void;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({ title, subtitle, progress, children, onBack }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 w-full fixed top-0 z-50">
                <div 
                    className="h-full bg-brand-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-12 md:justify-center">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="self-start mb-8 text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}

                <div className="animate-slide-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-gray-500 mb-8 font-light">
                            {subtitle}
                        </p>
                    )}

                    <div className="mt-6">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-gray-300 text-sm">
                Powered by VeriEasy &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default WizardLayout;
