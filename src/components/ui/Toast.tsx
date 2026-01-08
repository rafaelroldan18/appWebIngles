import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to allow enter animation
        requestAnimationFrame(() => setIsVisible(true));

        if (toast.duration !== Infinity) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onClose(toast.id), 300); // Wait for exit animation
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-white border-green-100 dark:bg-slate-800 dark:border-green-900/30',
        error: 'bg-white border-red-100 dark:bg-slate-800 dark:border-red-900/30',
        warning: 'bg-white border-amber-100 dark:bg-slate-800 dark:border-amber-900/30',
        info: 'bg-white border-blue-100 dark:bg-slate-800 dark:border-blue-900/30'
    };

    return (
        <div
            className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg ring-1 ring-black/5 
        transition-all duration-300 ease-out transform
        ${bgColors[toast.type]}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
            role="alert"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {icons[toast.type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        {toast.title && (
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                {toast.title}
                            </p>
                        )}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {toast.message}
                        </p>
                    </div>
                    <div className="ml-4 flex flex-shrink-0">
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(() => onClose(toast.id), 300);
                            }}
                            className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <span className="sr-only">Close</span>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function ToastContainer({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: string) => void }) {
    return (
        <div
            aria-live="assertive"
            className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-[100]"
        >
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                {/* Render from bottom to top or top to bottom - here we just stack them */}
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    );
}
