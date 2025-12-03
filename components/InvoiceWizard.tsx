
import React, { useState, useEffect } from 'react';
import WizardLayout from './WizardLayout';
import { FacturaDraft, TipoFactura, TipoImpuesto, Cliente, FacturaLinea, VerifactuResponse, UserProfile, SavedConcept } from '../types';
import { createFactura } from '../services/verifactuService';
import { FilePlus, Edit3, Trash2, User, Calendar, Tag, Check, Loader2, Plus, X, Search, AlertTriangle, Save, CreditCard, Percent, FileText } from 'lucide-react';

interface InvoiceWizardProps {
    profile: UserProfile;
    savedClients: Cliente[];
    savedConcepts: SavedConcept[];
    onCancel: () => void;
    onSuccess: (response: VerifactuResponse) => void;
    onSaveConcept: (concept: SavedConcept) => void;
    rectificationSource?: VerifactuResponse | null;
}

type WizardStep = 'ACTION' | 'CLIENT' | 'DETAILS' | 'ITEMS' | 'REVIEW' | 'SUBMITTING' | 'ERROR';

const InvoiceWizard: React.FC<InvoiceWizardProps> = ({ profile, savedClients, savedConcepts, onCancel, onSuccess, onSaveConcept, rectificationSource }) => {
    const [step, setStep] = useState<WizardStep>(rectificationSource ? 'DETAILS' : 'ACTION');
    const [submissionError, setSubmissionError] = useState<{message: string, suggestion: string} | null>(null);

    // Initial State
    const [draft, setDraft] = useState<FacturaDraft>(() => {
        const base: FacturaDraft = {
            serie: profile.series[0]?.code || 'A-2025',
            numero: profile.series[0]?.current_number.toString() || '1',
            fecha_expedicion: new Date().toISOString().split('T')[0],
            tipo_factura: TipoFactura.F1,
            is_proforma: false, // Default false
            emisor_nif: profile.nif,
            cliente: {
                nif: '',
                nombre: '',
                direccion: '',
                codigo_pais: 'ES'
            },
            lineas: [],
            base_imponible_total: '0.00',
            importe_iva_total: '0.00',
            
            aplicar_irpf: false,
            irpf_porcentaje: 15,
            importe_irpf_total: '0.00',
            
            importe_total: '0.00',
            
            condiciones_pago: 'Vencimiento a la vista (Inmediato)',
            metodo_pago: 'Transferencia Bancaria',
            iban_emisor: profile.iban,
            
            color_hex: profile.brand_color,
            logo_url: profile.logo_url
        };

        if (rectificationSource) {
            // Find a series starting with R, or fallback
            const rSeries = profile.series.find(s => s.code.startsWith('R')) || { code: 'R-' + new Date().getFullYear(), current_number: 1 };
            
            return {
                ...base,
                tipo_factura: TipoFactura.R1,
                serie: rSeries.code,
                numero: rSeries.current_number.toString(),
                rectificativa_referencia: rectificationSource.num_serie,
                rectificativa_motivo: 'Rectificación de factura',
                cliente: {
                    nif: rectificationSource.cliente_nif,
                    nombre: rectificationSource.cliente_nombre,
                    direccion: rectificationSource.cliente_direccion,
                    codigo_pais: 'ES'
                },
                lineas: rectificationSource.lineas,
                metodo_pago: rectificationSource.metodo_pago,
                condiciones_pago: rectificationSource.condiciones_pago,
                // Amounts will be recalculated by the useEffect on load
            };
        }

        return base;
    });

    // --- STEP 1: ACTION SELECTION ---
    const renderActionStep = () => (
        <WizardLayout title="¿Qué quieres hacer hoy?" progress={10} onBack={onCancel}>
            <div className="grid gap-4">
                <button 
                    onClick={() => {
                        setDraft({...draft, tipo_factura: TipoFactura.F1, is_proforma: false});
                        setStep('CLIENT');
                    }}
                    className="group flex items-center p-6 bg-white border-2 border-transparent hover:border-brand-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = profile.brand_color}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div className="p-3 rounded-xl mr-5 group-hover:scale-110 transition-transform bg-gray-50">
                        <FilePlus className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">Crear Factura Definitiva</h3>
                        <p className="text-gray-500 text-sm">Se generará hash y QR inmediatamente.</p>
                    </div>
                </button>

                 <button 
                    onClick={() => {
                        setDraft({...draft, tipo_factura: TipoFactura.F1, is_proforma: true});
                        setStep('CLIENT');
                    }}
                    className="group flex items-center p-6 bg-white border-2 border-transparent hover:border-brand-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = profile.brand_color}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div className="p-3 rounded-xl mr-5 group-hover:scale-110 transition-transform bg-yellow-50">
                        <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">Crear Proforma / Presupuesto</h3>
                        <p className="text-gray-500 text-sm">Borrador para enviar por email y aprobar luego.</p>
                    </div>
                </button>

                <button 
                    onClick={() => {
                        setDraft({
                            ...draft, 
                            tipo_factura: TipoFactura.R1, 
                            serie: 'R-2025',
                            is_proforma: false
                        });
                        setStep('CLIENT');
                    }}
                    className="group flex items-center p-6 bg-white border-2 border-transparent hover:border-brand-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
                >
                    <div className="p-3 rounded-xl mr-5 group-hover:scale-110 transition-transform bg-gray-50">
                        <Edit3 className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">Rectificar Factura</h3>
                        <p className="text-gray-500 text-sm">Emitir una abono o corrección (R1-R4).</p>
                    </div>
                </button>
            </div>
        </WizardLayout>
    );

    // --- STEP 2: CLIENT INFO ---
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isNewClient, setIsNewClient] = useState(true);

    const handleClientSelect = (id: string) => {
        setSelectedClientId(id);
        const client = savedClients.find(c => c.id === id);
        if (client) {
            setDraft(prev => ({ ...prev, cliente: { ...client } }));
            setIsNewClient(false);
        } else {
            setIsNewClient(true);
            setDraft(prev => ({ ...prev, cliente: { nif: '', nombre: '', direccion: '', codigo_pais: 'ES' } }));
        }
    };

    const renderClientStep = () => (
        <WizardLayout title="¿Para quién es el documento?" progress={30} onBack={() => setStep('ACTION')}>
            <div className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                {/* Client Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente Guardado</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-300" />
                        <select 
                            value={selectedClientId}
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                        >
                            <option value="">-- Crear Nuevo Cliente --</option>
                            {savedClients.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} ({c.nif})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={`space-y-4 transition-all ${!isNewClient ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Fiscal</label>
                        <input 
                            type="text" 
                            value={draft.cliente.nombre}
                            onChange={(e) => setDraft(prev => ({...prev, cliente: {...prev.cliente, nombre: e.target.value}}))}
                            placeholder="Ej. Empresa S.L."
                            className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                            readOnly={!isNewClient}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIF / CIF</label>
                            <input 
                                type="text" 
                                value={draft.cliente.nif}
                                onChange={(e) => setDraft(prev => ({...prev, cliente: {...prev.cliente, nif: e.target.value}}))}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                readOnly={!isNewClient}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                            <select 
                                value={draft.cliente.codigo_pais}
                                onChange={(e) => setDraft(prev => ({...prev, cliente: {...prev.cliente, codigo_pais: e.target.value}}))}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                disabled={!isNewClient}
                            >
                                <option value="ES">España</option>
                                <option value="PT">Portugal</option>
                                <option value="FR">Francia</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal Completa</label>
                        <textarea 
                            value={draft.cliente.direccion}
                            onChange={(e) => setDraft(prev => ({...prev, cliente: {...prev.cliente, direccion: e.target.value}}))}
                            placeholder="Calle, Número, CP, Ciudad..."
                            className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-brand-500 h-20"
                            readOnly={!isNewClient}
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={() => setStep('DETAILS')}
                disabled={!draft.cliente.nombre || !draft.cliente.nif || !draft.cliente.direccion}
                style={{ backgroundColor: profile.brand_color }}
                className="mt-8 w-full text-white py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continuar
            </button>
        </WizardLayout>
    );

    // --- STEP 3: DETAILS (Series, Date, Commercial) ---
    useEffect(() => {
        // Only auto-update number if NOT a proforma (Proformas don't consume series yet)
        if (!draft.is_proforma) {
            const serieInfo = profile.series.find(s => s.code === draft.serie);
            if (serieInfo) {
                setDraft(prev => ({ ...prev, numero: serieInfo.current_number.toString() }));
            }
        } else {
             setDraft(prev => ({ ...prev, numero: 'PRO-BORRADOR' }));
        }
    }, [draft.serie, profile.series, draft.is_proforma]);

    const isRectificativa = draft.tipo_factura.startsWith('R');

    const renderDetailsStep = () => (
        <WizardLayout title="Datos del documento" progress={50} onBack={() => setStep(rectificationSource ? 'DETAILS' : 'CLIENT')}>
            <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Numeration */}
                {!draft.is_proforma ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                            <select 
                                value={draft.serie}
                                onChange={(e) => setDraft({...draft, serie: e.target.value})}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                            >
                                {profile.series.map(s => (
                                    <option key={s.code} value={s.code}>{s.code}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input 
                                type="text" 
                                value={draft.numero}
                                readOnly
                                className="w-full p-3 bg-gray-50 border-none rounded-xl text-gray-500"
                            />
                            <p className="text-xs text-gray-400 mt-1 ml-1">Autogenerado (SNC)</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium">Modo Proforma</p>
                        <p className="text-xs text-yellow-700">No se asignará serie ni número fiscal hasta que se apruebe.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-300" />
                        <input 
                            type="date" 
                            value={draft.fecha_expedicion}
                            onChange={(e) => setDraft({...draft, fecha_expedicion: e.target.value})}
                            className="w-full pl-10 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Rectificativa specific fields */}
                {isRectificativa && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-semibold text-amber-800 text-sm mb-3">Datos Rectificativa</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-amber-700 mb-1">Factura Original (Referencia)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. A-2024/099"
                                    value={draft.rectificativa_referencia || ''}
                                    onChange={(e) => setDraft({...draft, rectificativa_referencia: e.target.value})}
                                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-amber-700 mb-1">Motivo</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. Error en precio unitario"
                                    value={draft.rectificativa_motivo || ''}
                                    onChange={(e) => setDraft({...draft, rectificativa_motivo: e.target.value})}
                                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Commercial Data */}
                <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Condiciones de Pago</h4>
                    <div className="grid gap-3">
                         <div>
                            <label className="block text-xs text-gray-500 mb-1">Método de Pago</label>
                            <select 
                                value={draft.metodo_pago}
                                onChange={(e) => setDraft({...draft, metodo_pago: e.target.value})}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm border-none"
                            >
                                <option>Transferencia Bancaria</option>
                                <option>Domiciliación Bancaria</option>
                                <option>Tarjeta / TPV</option>
                                <option>Bizum</option>
                                <option>Efectivo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Condiciones (Vencimiento)</label>
                            <input 
                                type="text"
                                value={draft.condiciones_pago}
                                onChange={(e) => setDraft({...draft, condiciones_pago: e.target.value})}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm border-none"
                            />
                        </div>
                        <div>
                             <label className="block text-xs text-gray-500 mb-1">IBAN para cobro</label>
                             <input 
                                type="text"
                                value={draft.iban_emisor}
                                onChange={(e) => setDraft({...draft, iban_emisor: e.target.value})}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm border-none font-mono"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <button 
                onClick={() => setStep('ITEMS')}
                style={{ backgroundColor: profile.brand_color }}
                className="mt-8 w-full text-white py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
                Siguiente: Conceptos
            </button>
        </WizardLayout>
    );

    // --- STEP 4: ITEMS & MATH ---
    const [newItem, setNewItem] = useState({ desc: '', qty: 1, price: 0, tax: 21 });
    const [selectedConceptId, setSelectedConceptId] = useState('');
    const [saveToDb, setSaveToDb] = useState(false);

    // Math calculation effect
    useEffect(() => {
        const base = draft.lineas.reduce((acc, curr) => acc + parseFloat(curr.base_imponible), 0);
        const iva = draft.lineas.reduce((acc, curr) => acc + parseFloat(curr.cuota_repercutida), 0);
        
        let irpfAmount = 0;
        if (draft.aplicar_irpf) {
            irpfAmount = (base * draft.irpf_porcentaje) / 100;
        }

        const total = base + iva - irpfAmount;

        setDraft(prev => ({
            ...prev,
            base_imponible_total: base.toFixed(2),
            importe_iva_total: iva.toFixed(2),
            importe_irpf_total: irpfAmount.toFixed(2),
            importe_total: total.toFixed(2)
        }));

    }, [draft.lineas, draft.aplicar_irpf, draft.irpf_porcentaje]);


    const handleConceptSelect = (id: string) => {
        setSelectedConceptId(id);
        if (id === 'NEW') {
            setNewItem({ desc: '', qty: 1, price: 0, tax: 21 });
            setSaveToDb(false);
            return;
        }
        const concept = savedConcepts.find(c => c.id === id);
        if (concept) {
            setNewItem({
                desc: concept.descripcion,
                qty: 1,
                price: concept.precio_default,
                tax: concept.iva_default
            });
            setSaveToDb(false);
        }
    };

    const addItem = () => {
        if (!newItem.desc) return;
        
        if (saveToDb) {
            onSaveConcept({
                id: crypto.randomUUID(),
                alias: newItem.desc,
                descripcion: newItem.desc,
                precio_default: newItem.price,
                iva_default: newItem.tax
            });
            setSaveToDb(false);
        }

        const base = newItem.qty * newItem.price;
        const cuota = (base * newItem.tax) / 100;
        
        const linea: FacturaLinea = {
            descripcion: newItem.desc,
            cantidad: newItem.qty,
            precio_unitario: newItem.price,
            base_imponible: base.toFixed(2),
            tipo_impositivo: newItem.tax.toString(),
            impuesto: TipoImpuesto.IVA,
            cuota_repercutida: cuota.toFixed(2)
        };

        setDraft(prev => ({ ...prev, lineas: [...prev.lineas, linea] }));
        setNewItem({ desc: '', qty: 1, price: 0, tax: 21 });
        setSelectedConceptId('');
    };

    const deleteItem = (idx: number) => {
        setDraft(prev => ({...prev, lineas: prev.lineas.filter((_, i) => i !== idx)}));
    };

    const renderItemsStep = () => (
        <WizardLayout title="Conceptos" subtitle="Detalla los servicios y retenciones." progress={70} onBack={() => setStep('DETAILS')}>
            <div className="space-y-4">
                {/* List of added items */}
                {draft.lineas.map((linea, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm animate-fade-in">
                        <div>
                            <p className="font-medium text-gray-900">{linea.descripcion}</p>
                            <p className="text-xs text-gray-500">{linea.cantidad} x {linea.precio_unitario}€ + {linea.tipo_impositivo}% IVA</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700">{(parseFloat(linea.base_imponible) + parseFloat(linea.cuota_repercutida)).toFixed(2)}€</span>
                            <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}

                {/* Add new item form */}
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                    <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">Cargar Concepto</label>
                        <select 
                            className="w-full bg-white rounded-lg px-2 py-2 text-sm border-none shadow-sm mb-3 focus:ring-2 focus:ring-brand-500 outline-none"
                            onChange={(e) => handleConceptSelect(e.target.value)}
                            value={selectedConceptId}
                        >
                            <option value="" disabled>Seleccionar...</option>
                            <option value="NEW" className="font-bold text-brand-600">-- Nuevo / Limpiar --</option>
                            {savedConcepts.map(c => <option key={c.id} value={c.id}>{c.alias}</option>)}
                        </select>

                        <input 
                            type="text" 
                            placeholder="Descripción"
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-800 placeholder-gray-400 font-medium mb-2"
                            value={newItem.desc}
                            onChange={e => setNewItem({...newItem, desc: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-20">
                            <label className="text-xs text-gray-400 block mb-1">Cant.</label>
                            <input type="number" className="w-full bg-white rounded-lg px-2 py-1 text-sm border-none shadow-sm" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: Number(e.target.value)})} />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-400 block mb-1">Precio</label>
                            <input type="number" className="w-full bg-white rounded-lg px-2 py-1 text-sm border-none shadow-sm" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                        </div>
                        <div className="w-20">
                            <label className="text-xs text-gray-400 block mb-1">IVA %</label>
                            <select className="w-full bg-white rounded-lg px-2 py-1 text-sm border-none shadow-sm" value={newItem.tax} onChange={e => setNewItem({...newItem, tax: Number(e.target.value)})}>
                                <option value="21">21%</option>
                                <option value="10">10%</option>
                                <option value="4">4%</option>
                                <option value="0">0%</option>
                            </select>
                        </div>
                        <div className="flex-1 flex items-end justify-end">
                            <button onClick={addItem} disabled={!newItem.desc || newItem.price <= 0} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-700 disabled:opacity-30"><Plus className="w-5 h-5" /></button>
                        </div>
                    </div>
                     <div className="mt-3 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="saveDb"
                            checked={saveToDb}
                            onChange={(e) => setSaveToDb(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="saveDb" className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                            <Save className="w-3 h-3" />
                            Guardar en conceptos frecuentes
                        </label>
                    </div>
                </div>

                {/* IRPF Toggle */}
                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg"><Percent className="w-4 h-4 text-blue-600"/></div>
                        <div>
                            <p className="font-medium text-sm text-blue-900">Retención IRPF (Autónomos)</p>
                            <p className="text-xs text-blue-700">Aplicar IRPF en factura</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {draft.aplicar_irpf && (
                             <select 
                                value={draft.irpf_porcentaje}
                                onChange={(e) => setDraft({...draft, irpf_porcentaje: Number(e.target.value)})}
                                className="bg-white border-none rounded-lg text-sm p-1 focus:ring-0"
                            >
                                <option value="15">15%</option>
                                <option value="7">7%</option>
                                <option value="1">1%</option>
                            </select>
                        )}
                        <button 
                            onClick={() => setDraft(prev => ({...prev, aplicar_irpf: !prev.aplicar_irpf}))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${draft.aplicar_irpf ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${draft.aplicar_irpf ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>
                </div>
            </div>

            <div className="mt-6 bg-gray-100 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Base Imponible</span>
                    <span>{draft.base_imponible_total} €</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>IVA Total</span>
                    <span>{draft.importe_iva_total} €</span>
                </div>
                {draft.aplicar_irpf && (
                     <div className="flex justify-between text-sm text-blue-600 font-medium">
                        <span>- IRPF ({draft.irpf_porcentaje}%)</span>
                        <span>-{draft.importe_irpf_total} €</span>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-medium">Total a Pagar</span>
                    <span className="text-2xl font-bold text-gray-900">{draft.importe_total} €</span>
                </div>
            </div>

            <button 
                onClick={() => setStep('REVIEW')}
                disabled={draft.lineas.length === 0}
                style={{ backgroundColor: profile.brand_color }}
                className="mt-8 w-full text-white py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
                Revisar {draft.is_proforma ? 'Proforma' : 'Factura'}
            </button>
        </WizardLayout>
    );

    // --- STEP 5: REVIEW & SUBMIT ---
    const handleSubmit = async () => {
        setStep('SUBMITTING');
        setSubmissionError(null);
        try {
            const response = await createFactura(draft);
            onSuccess(response);
        } catch (error: any) {
            setStep('ERROR');
            setSubmissionError({
                message: error.message || "Error desconocido",
                suggestion: error.suggestion || "Inténtalo de nuevo más tarde."
            });
        }
    };

    const renderReviewStep = () => (
        <WizardLayout title="Resumen" subtitle="Comprueba que todo esté correcto." progress={90} onBack={() => setStep('ITEMS')}>
            {draft.is_proforma && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6 text-sm">
                    <strong>Estás creando una Proforma.</strong> Esto no generará una factura legal ni se enviará a Hacienda todavía. Podrás enviarla por email y convertirla a factura cuando el cliente apruebe.
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
                <div className="h-2 w-full" style={{ backgroundColor: profile.brand_color }}></div>
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {profile.logo_url && <img src={profile.logo_url} className="h-8 mb-4 object-contain" alt="Logo" />}
                            <h3 className="text-2xl font-bold text-gray-900">
                                {draft.is_proforma ? 'PROFORMA' : `${draft.serie}-${draft.numero}`}
                            </h3>
                            <p className="text-gray-500">{draft.fecha_expedicion}</p>
                            {isRectificativa && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded mt-2 inline-block">
                                    Rectifica a: {draft.rectificativa_referencia}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-gray-900">{draft.cliente.nombre}</p>
                            <p className="text-sm text-gray-500">{draft.cliente.nif}</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[150px] ml-auto">{draft.cliente.direccion}</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 py-4 space-y-3">
                        {draft.lineas.map((linea, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">{linea.descripcion} (x{linea.cantidad})</span>
                                <span className="font-medium text-gray-900">{linea.base_imponible}€</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                             <span>Base</span>
                             <span>{draft.base_imponible_total} €</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                             <span>IVA</span>
                             <span>{draft.importe_iva_total} €</span>
                        </div>
                        {draft.aplicar_irpf && (
                             <div className="flex justify-between text-sm text-gray-500">
                                <span>IRPF</span>
                                <span>-{draft.importe_irpf_total} €</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-bold" style={{ color: profile.brand_color }}>{draft.importe_total} €</span>
                        </div>
                    </div>
                </div>
            </div>
            <button 
                onClick={handleSubmit}
                className={`mt-8 w-full text-white py-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${draft.is_proforma ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-900 hover:bg-gray-800'}`}
            >
                {draft.is_proforma ? (
                    <><Save className="w-5 h-5" /> Guardar Proforma</>
                ) : (
                    <><Check className="w-5 h-5" /> Confirmar y Emitir</>
                )}
            </button>
        </WizardLayout>
    );

    const renderErrorStep = () => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4"><AlertTriangle className="w-10 h-10 text-red-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error en Veri*factu*</h2>
            <p className="text-red-700 font-medium text-lg mb-2">{submissionError?.message}</p>
            <p className="text-gray-600 max-w-md mb-8">{submissionError?.suggestion}</p>
            <button onClick={() => setStep('REVIEW')} className="bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-50">Volver y Corregir</button>
        </div>
    );

    const renderSubmitting = () => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
                {draft.is_proforma ? 'Guardando Proforma...' : 'Enviando a Hacienda...'}
            </h2>
            <p className="text-gray-500 mt-2">
                {draft.is_proforma ? 'Generando borrador para envío.' : 'Firmando digitalmente y generando QR.'}
            </p>
        </div>
    );

    switch(step) {
        case 'ACTION': return renderActionStep();
        case 'CLIENT': return renderClientStep();
        case 'DETAILS': return renderDetailsStep();
        case 'ITEMS': return renderItemsStep();
        case 'REVIEW': return renderReviewStep();
        case 'SUBMITTING': return renderSubmitting();
        case 'ERROR': return renderErrorStep();
        default: return renderActionStep();
    }
};

export default InvoiceWizard;
