
import React, { useState } from 'react';
import { Plus, FileText, AlertCircle, CheckCircle, XCircle, Settings, Database, Download, Mail, ArrowRight, Loader2, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { VerifactuResponse, EstadoFactura, UserProfile } from '../types';
import { sendProformaEmail, approveProforma, cancelFactura } from '../services/verifactuService';
import CancellationModal from './CancellationModal';

interface DashboardProps {
    invoices: VerifactuResponse[];
    profile: UserProfile;
    onStartNew: () => void;
    onOpenSettings: () => void;
    onOpenDatabase: () => void;
    onRectify: (invoice: VerifactuResponse) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, profile, onStartNew, onOpenSettings, onOpenDatabase, onRectify }) => {
    
    // --- ACTIONS STATE ---
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    
    // Cancellation Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [invoiceToCancel, setInvoiceToCancel] = useState<VerifactuResponse | null>(null);

    const toggleMenu = (id: string) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    // --- PROFORMA HANDLERS ---

    const handleSendEmail = async (invoice: VerifactuResponse) => {
        setProcessingId(invoice.uuid);
        try {
            await sendProformaEmail(invoice.uuid, profile);
            alert("Email enviado correctamente (Simulación en Consola)");
        } catch (e) {
            alert("Error enviando email");
        } finally {
            setProcessingId(null);
        }
    };

    const handleConvert = async (invoice: VerifactuResponse) => {
        const serie = profile.series[0]; // Default series for conversion
        if (!confirm(`¿Aprobar proforma y convertir a factura legal en serie ${serie.code}?`)) return;

        setProcessingId(invoice.uuid);
        try {
            await approveProforma(invoice.uuid, serie);
            alert("Factura emitida y firmada correctamente.");
            window.location.reload(); // Simple reload to refresh data
        } catch (e) {
            alert("Error en conversión");
        } finally {
            setProcessingId(null);
        }
    };

    // --- CORRECTION HANDLERS ---

    const handleCancelClick = (invoice: VerifactuResponse) => {
        setInvoiceToCancel(invoice);
        setCancelModalOpen(true);
        setOpenMenuId(null);
    };

    const handleConfirmCancellation = async (reason: string) => {
        if (!invoiceToCancel) return;
        
        setProcessingId(invoiceToCancel.uuid);
        try {
            await cancelFactura(invoiceToCancel, reason);
            setCancelModalOpen(false);
            setInvoiceToCancel(null);
            // Force refresh in this mock environment
            alert("Factura anulada correctamente.");
            window.location.reload(); 
        } catch (error: any) {
            if (error.message === "NOT_LAST_INVOICE") {
                alert("⛔ ERROR: No se puede anular esta factura porque NO es la última emitida de su serie.\n\nDebe utilizar la opción 'Rectificar Factura' para corregir los importes legalmente.");
            } else {
                alert("Error al anular la factura: " + error.message);
            }
            setCancelModalOpen(false);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRectifyClick = (invoice: VerifactuResponse) => {
        setOpenMenuId(null);
        onRectify(invoice);
    };

    // --- ICONS & HELPERS ---

    const getStatusIcon = (status: EstadoFactura) => {
        switch (status) {
            case EstadoFactura.CORRECTO:
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case EstadoFactura.ANULADA:
                return <XCircle className="w-5 h-5 text-red-500" />;
            case EstadoFactura.PROFORMA:
                return <FileText className="w-5 h-5 text-blue-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        }
    };

    // --- A4 PDF GENERATION ENGINE ---
    const handlePrint = (invoice: VerifactuResponse) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const isIRPF = parseFloat(invoice.cuota_irpf) > 0;
        const isProforma = invoice.estado === EstadoFactura.PROFORMA;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${isProforma ? 'PROFORMA' : 'Factura'} ${invoice.num_serie}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
                        .print-container { width: 210mm; min-height: 297mm; padding: 15mm; margin: auto; }
                    }
                    body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 20px; }
                    .print-container { 
                        background: white; 
                        width: 210mm; 
                        min-height: 297mm; 
                        margin: 0 auto; 
                        padding: 15mm 20mm; 
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
                        position: relative;
                        display: flex;
                        flex-direction: column;
                    }
                    .footer { margin-top: auto; }
                    .watermark {
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 100px;
                        color: rgba(0,0,0,0.05);
                        font-weight: bold;
                        pointer-events: none;
                        white-space: nowrap;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="print-container">
                    ${isProforma ? '<div class="watermark">BORRADOR</div>' : ''}
                    ${invoice.estado === EstadoFactura.ANULADA ? '<div class="watermark" style="color: rgba(255,0,0,0.1)">ANULADA</div>' : ''}
                    
                    <!-- HEADER -->
                    <div class="flex justify-between items-start mb-12">
                        <div class="w-1/2">
                            ${profile.logo_url 
                                ? `<img src="${profile.logo_url}" class="h-16 object-contain mb-4" />` 
                                : `<h1 class="text-3xl font-bold mb-2" style="color: ${profile.brand_color}">${profile.nombre_fiscal}</h1>`
                            }
                            <div class="text-sm text-gray-500">
                                <p class="font-bold text-gray-800">${profile.nombre_fiscal}</p>
                                <p>NIF: ${profile.nif}</p>
                                <p class="whitespace-pre-line">${profile.direccion}</p>
                            </div>
                        </div>
                        <div class="w-1/2 text-right">
                            <h2 class="text-4xl font-light text-gray-900 mb-2">${isProforma ? 'PROFORMA' : 'FACTURA'}</h2>
                            <p class="text-lg font-bold text-gray-700">Nº ${invoice.num_serie}</p>
                            <p class="text-sm text-gray-500">Fecha: ${invoice.fecha_expedicion}</p>
                        </div>
                    </div>

                    <!-- CLIENT INFO -->
                    <div class="mb-12 p-6 bg-gray-50 rounded-lg border border-gray-100">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturar a</h3>
                        <p class="text-xl font-bold text-gray-900">${invoice.cliente_nombre}</p>
                        <p class="text-gray-700">NIF: ${invoice.cliente_nif}</p>
                        <p class="text-gray-600 whitespace-pre-line">${invoice.cliente_direccion || ''}</p>
                    </div>

                    <!-- ITEMS TABLE -->
                    <table class="w-full mb-8">
                        <thead>
                            <tr style="background-color: ${profile.brand_color}; color: white;">
                                <th class="p-3 text-left text-sm font-semibold rounded-l-lg">Concepto</th>
                                <th class="p-3 text-right text-sm font-semibold">Cant.</th>
                                <th class="p-3 text-right text-sm font-semibold">Precio U.</th>
                                <th class="p-3 text-right text-sm font-semibold">IVA</th>
                                <th class="p-3 text-right text-sm font-semibold rounded-r-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-700 text-sm">
                            ${invoice.lineas.map(l => `
                                <tr class="border-b border-gray-100">
                                    <td class="p-3">${l.descripcion}</td>
                                    <td class="p-3 text-right">${l.cantidad}</td>
                                    <td class="p-3 text-right">${l.precio_unitario}€</td>
                                    <td class="p-3 text-right">${l.tipo_impositivo}%</td>
                                    <td class="p-3 text-right font-medium">${l.base_imponible}€</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <!-- TOTALS CALCULATION -->
                    <div class="flex justify-end mb-12">
                        <div class="w-64 space-y-2">
                            <div class="flex justify-between text-sm text-gray-600">
                                <span>Base Imponible:</span>
                                <span>${invoice.base_imponible} €</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-600">
                                <span>Cuota IVA:</span>
                                <span>${invoice.cuota_iva} €</span>
                            </div>
                            ${isIRPF ? `
                            <div class="flex justify-between text-sm text-gray-600">
                                <span>Retención IRPF:</span>
                                <span>-${invoice.cuota_irpf} €</span>
                            </div>` : ''}
                            <div class="flex justify-between items-center pt-3 border-t-2 border-gray-900 text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>${invoice.importe_total} €</span>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER (Payment & Legal) -->
                    <div class="footer">
                        <div class="grid grid-cols-2 gap-8 mb-8 text-sm">
                            <div>
                                <h4 class="font-bold text-gray-900 mb-1">Forma de Pago</h4>
                                <p class="text-gray-600">${invoice.metodo_pago}</p>
                                <p class="text-gray-600 font-mono mt-1">${invoice.iban || ''}</p>
                                <p class="text-gray-500 text-xs mt-2">${invoice.condiciones_pago}</p>
                            </div>
                        </div>

                        <!-- VERIFACTU BLOCK -->
                        ${!isProforma && invoice.estado !== EstadoFactura.ANULADA ? `
                        <div class="border-t border-gray-200 pt-6 flex items-center justify-between">
                            <div class="text-xs text-gray-400 max-w-md">
                                <p class="font-bold mb-1">Registro de Facturación (Veri*factu*)</p>
                                <p class="font-mono text-[10px] break-all">Huella: ${invoice.hash_propio}</p>
                                <p class="font-mono text-[10px] break-all mt-1">Anterior: ${invoice.hash_anterior}</p>
                                <p class="mt-2">Factura generada conforme al reglamento Veri*factu*.</p>
                            </div>
                            <div class="text-center">
                                <img src="data:image/png;base64,${invoice.qr}" class="w-24 h-24 mb-1 border border-gray-100 p-1" />
                                <span class="text-[9px] text-gray-400 block">Escanear para verificar</span>
                            </div>
                        </div>
                        ` : ''}
                        ${invoice.estado === EstadoFactura.ANULADA ? `
                            <div class="border-t border-red-200 pt-6 text-center text-xs text-red-600 font-bold">
                                <p>DOCUMENTO ANULADO</p>
                            </div>
                        ` : ''}
                        ${isProforma ? `
                        <div class="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
                            <p>Este documento es una Proforma y no es válido como factura.</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in" onClick={() => setOpenMenuId(null)}>
            <CancellationModal 
                isOpen={cancelModalOpen} 
                onClose={() => setCancelModalOpen(false)}
                onConfirm={handleConfirmCancellation}
                isProcessing={!!processingId}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                    {profile.logo_url && <img src={profile.logo_url} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow-sm" />}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Facturas</h1>
                        <p className="text-gray-500 mt-1">Hola, {profile.nombre_fiscal || 'Autónomo'}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={onOpenSettings}
                        className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Configuración"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onOpenDatabase}
                        className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Base de Datos"
                    >
                        <Database className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onStartNew}
                        style={{ backgroundColor: profile.brand_color }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Historial Reciente</h2>
                    <span className="text-sm text-gray-400">{invoices.length} documentos</span>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>No has creado ninguna factura aún.</p>
                        <p className="text-sm mt-2">Pulsa "Nueva Factura" para empezar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-20"> {/* Extra padding for dropdowns */}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Referencia</th>
                                    <th className="px-6 py-4 font-medium">Fecha</th>
                                    <th className="px-6 py-4 font-medium">Cliente</th>
                                    <th className="px-6 py-4 font-medium">Importe</th>
                                    <th className="px-6 py-4 font-medium">Estado</th>
                                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoices.map((inv) => (
                                    <tr key={inv.uuid} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {inv.num_serie}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {inv.fecha_expedicion}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">
                                            {inv.cliente_nombre}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800">
                                            {inv.importe_total} €
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(inv.estado)}
                                                <div className="flex flex-col">
                                                    <span className={`
                                                        ${inv.estado === EstadoFactura.CORRECTO ? 'text-green-600' : ''}
                                                        ${inv.estado === EstadoFactura.PENDIENTE ? 'text-green-600' : ''}
                                                        ${inv.estado === EstadoFactura.ANULADA ? 'text-red-600' : ''}
                                                        ${inv.estado === EstadoFactura.PROFORMA ? 'text-blue-600' : ''}
                                                    `}>{inv.estado}</span>
                                                    {inv.fecha_envio_email && <span className="text-[10px] text-gray-400">Enviado</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 items-center relative">
                                            {/* Action Buttons */}
                                            {processingId === inv.uuid ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlePrint(inv); }}
                                                        className="text-gray-500 hover:text-gray-700 p-1"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {/* PROFORMA ACTIONS */}
                                                    {inv.estado === EstadoFactura.PROFORMA && (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleSendEmail(inv); }}
                                                                className="text-blue-500 hover:text-blue-700 p-1"
                                                                title="Enviar Email al Cliente"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleConvert(inv); }}
                                                                className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 px-3 py-1 rounded-full hover:bg-green-50 flex items-center gap-1"
                                                                title="Aprobar y Emitir Factura"
                                                            >
                                                                Emitir <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* CORRECTED INVOICE ACTIONS (MENU) */}
                                                    {inv.estado === EstadoFactura.CORRECTO && (
                                                        <div className="relative">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); toggleMenu(inv.uuid); }}
                                                                className="p-1 hover:bg-gray-100 rounded-full"
                                                            >
                                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                                            </button>
                                                            
                                                            {/* DROPDOWN MENU */}
                                                            {openMenuId === inv.uuid && (
                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                                                                    <div className="py-1">
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleRectifyClick(inv); }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                        >
                                                                            <Edit3 className="w-4 h-4 text-gray-500" /> Rectificar Factura
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleCancelClick(inv); }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 text-red-500" /> Anular Factura
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
