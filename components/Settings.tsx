
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Save, Upload, Plus, Trash2, ArrowLeft, CreditCard, Mail, Info } from 'lucide-react';

interface SettingsProps {
    profile: UserProfile;
    onSave: (p: UserProfile) => void;
    onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onSave, onBack }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'EMAIL'>('GENERAL');
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [newSerie, setNewSerie] = useState('');

    const handleSave = () => {
        onSave(formData);
    };

    const addSerie = () => {
        if (newSerie && !formData.series.find(s => s.code === newSerie)) {
            setFormData({
                ...formData,
                series: [...formData.series, { code: newSerie, current_number: 1 }]
            });
            setNewSerie('');
        }
    };

    const removeSerie = (code: string) => {
        setFormData({
            ...formData,
            series: formData.series.filter(s => s.code !== code)
        });
    };

    const handleLogoUpload = () => {
        const mockLogo = "https://via.placeholder.com/150?text=LOGO";
        setFormData({...formData, logo_url: mockLogo});
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
             <button 
                onClick={onBack}
                className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
            </button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                    <p className="text-gray-500">Personaliza tus datos fiscales, branding y comunicaciones.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('GENERAL')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'GENERAL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Datos y Series
                    </button>
                    <button 
                        onClick={() => setActiveTab('EMAIL')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'EMAIL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Comunicaciones
                    </button>
                </div>
            </div>

            {activeTab === 'GENERAL' && (
                <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                    
                    {/* Branding Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4">Marca y Logotipo</h2>
                        
                        <div className="mb-6 flex flex-col items-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            {formData.logo_url ? (
                                <img src={formData.logo_url} alt="Logo" className="h-16 object-contain mb-4" />
                            ) : (
                                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Upload className="w-8 h-8" />
                                </div>
                            )}
                            <button 
                                onClick={handleLogoUpload}
                                className="text-sm text-brand-600 font-medium hover:underline"
                            >
                                {formData.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color Corporativo</label>
                            <div className="flex gap-3">
                                {['#0ea5e9', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setFormData({...formData, brand_color: c})}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.brand_color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Data Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4">Datos Fiscales (Emisor)</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Razón Social</label>
                                <input 
                                    type="text" 
                                    value={formData.nombre_fiscal}
                                    onChange={e => setFormData({...formData, nombre_fiscal: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIF / CIF</label>
                                <input 
                                    type="text" 
                                    value={formData.nif}
                                    onChange={e => setFormData({...formData, nif: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN (Cuenta Bancaria)</label>
                                <div className="relative">
                                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                                    <input 
                                        type="text" 
                                        placeholder="ES91 0000..."
                                        value={formData.iban || ''}
                                        onChange={e => setFormData({...formData, iban: e.target.value})}
                                        className="w-full pl-9 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
                                <textarea 
                                    value={formData.direccion}
                                    onChange={e => setFormData({...formData, direccion: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Series Configuration */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Series de Facturación</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Define las series que utilizas. El número se incrementará automáticamente (Veri*factu* requiere continuidad).
                        </p>
                        
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2">Serie</th>
                                        <th className="px-4 py-2">Próximo Número</th>
                                        <th className="px-4 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.series.map(s => (
                                        <tr key={s.code}>
                                            <td className="px-4 py-3 font-medium">{s.code}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    value={s.current_number}
                                                    onChange={(e) => {
                                                        const newSeries = formData.series.map(ser => 
                                                            ser.code === s.code ? { ...ser, current_number: parseInt(e.target.value) } : ser
                                                        );
                                                        setFormData({...formData, series: newSeries});
                                                    }}
                                                    className="w-20 p-1 border rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removeSerie(s.code)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Nueva serie (ej. F2-2025)"
                                value={newSerie}
                                onChange={e => setNewSerie(e.target.value)}
                                className="flex-1 p-2 border border-gray-200 rounded-lg"
                            />
                            <button 
                                onClick={addSerie}
                                disabled={!newSerie}
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'EMAIL' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-1">Plantillas de Email</h2>
                            <p className="text-sm text-gray-500">Configura cómo reciben tus clientes las Proformas y Facturas.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto (Reply-To)</label>
                                <p className="text-xs text-gray-500 mb-2">Las respuestas de tus clientes llegarán a esta dirección.</p>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                                    <input 
                                        type="email" 
                                        value={formData.email_contacto || ''}
                                        onChange={e => setFormData({...formData, email_contacto: e.target.value})}
                                        className="w-full pl-9 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="tu-email@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <Info className="w-4 h-4" /> Variables Disponibles
                                </div>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li><code>[NOMBRE_CLIENTE]</code>: Nombre del cliente.</li>
                                    <li><code>[IMPORTE_TOTAL]</code>: Total de la operación.</li>
                                    <li><code>[ENLACE_APROBACION]</code>: Link único para aprobar.</li>
                                    <li><code>[NUMERO_DOC]</code>: Referencia del documento.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del Email (Proforma)</label>
                                <input 
                                    type="text" 
                                    value={formData.email_proforma_asunto || ''}
                                    onChange={e => setFormData({...formData, email_proforma_asunto: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo del Email (Proforma)</label>
                                <textarea 
                                    value={formData.email_proforma_cuerpo || ''}
                                    onChange={e => setFormData({...formData, email_proforma_cuerpo: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-48 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/30"
                >
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default Settings;
