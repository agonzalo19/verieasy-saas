
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isProcessing: boolean;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onConfirm, isProcessing }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (reason.trim().length > 5) {
            onConfirm(reason);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                    <div className="bg-red-100 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Anular Factura Emitida</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Acción irreversible conforme a la normativa Veri*factu*.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-red-400 hover:text-red-600 ml-auto">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-semibold mb-2">⚠️ Advertencia Legal:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>El número de factura <strong>no podrá ser reutilizado</strong>.</li>
                            <li>Quedará constancia del salto en el registro de la AEAT.</li>
                            <li>Solo permitido si es la <strong>última factura</strong> de la serie.</li>
                        </ul>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de la Anulación (Obligatorio)
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej. Error en los datos del cliente, se emitirá nueva..."
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-32 text-sm resize-none"
                    />
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isProcessing || reason.trim().length < 5}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessing ? 'Procesando...' : 'Confirmar Anulación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancellationModal;
