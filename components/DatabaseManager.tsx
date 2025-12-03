import React, { useState } from 'react';
import { Cliente, SavedConcept } from '../types';
import { Users, Tag, Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';

interface DatabaseManagerProps {
    clients: Cliente[];
    concepts: SavedConcept[];
    onUpdateClients: (c: Cliente[]) => void;
    onUpdateConcepts: (c: SavedConcept[]) => void;
    onBack: () => void;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ 
    clients, concepts, onUpdateClients, onUpdateConcepts, onBack 
}) => {
    const [tab, setTab] = useState<'CLIENTS' | 'CONCEPTS'>('CLIENTS');
    const [editingClient, setEditingClient] = useState<Partial<Cliente> | null>(null);
    const [editingConcept, setEditingConcept] = useState<Partial<SavedConcept> | null>(null);

    // --- CLIENTS LOGIC ---
    const handleSaveClient = () => {
        if (!editingClient?.nif || !editingClient?.nombre) return;
        
        const newClient = {
            id: editingClient.id || crypto.randomUUID(),
            nif: editingClient.nif,
            nombre: editingClient.nombre,
            direccion: editingClient.direccion || '',
            codigo_pais: editingClient.codigo_pais || 'ES',
            email: editingClient.email
        };

        if (editingClient.id) {
            onUpdateClients(clients.map(c => c.id === newClient.id ? newClient : c));
        } else {
            onUpdateClients([...clients, newClient]);
        }
        setEditingClient(null);
    };

    const handleDeleteClient = (id: string) => {
        onUpdateClients(clients.filter(c => c.id !== id));
    };

    // --- CONCEPTS LOGIC ---
    const handleSaveConcept = () => {
        if (!editingConcept?.alias || !editingConcept?.descripcion) return;
        
        const newConcept = {
            id: editingConcept.id || crypto.randomUUID(),
            alias: editingConcept.alias,
            descripcion: editingConcept.descripcion,
            precio_default: Number(editingConcept.precio_default) || 0,
            iva_default: Number(editingConcept.iva_default) || 21
        };

        if (editingConcept.id) {
            onUpdateConcepts(concepts.map(c => c.id === newConcept.id ? newConcept : c));
        } else {
            onUpdateConcepts([...concepts, newConcept]);
        }
        setEditingConcept(null);
    };

    const handleDeleteConcept = (id: string) => {
        onUpdateConcepts(concepts.filter(c => c.id !== id));
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
             <button 
                onClick={onBack}
                className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">Base de Datos</h1>

            {/* TABS */}
            <div className="flex border-b border-gray-200 mb-8">
                <button 
                    onClick={() => setTab('CLIENTS')}
                    className={`pb-4 px-6 font-medium flex items-center gap-2 ${tab === 'CLIENTS' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500'}`}
                >
                    <Users className="w-5 h-5" /> Clientes
                </button>
                <button 
                    onClick={() => setTab('CONCEPTS')}
                    className={`pb-4 px-6 font-medium flex items-center gap-2 ${tab === 'CONCEPTS' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500'}`}
                >
                    <Tag className="w-5 h-5" /> Conceptos
                </button>
            </div>

            {/* CONTENT */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                
                {/* --- CLIENTS VIEW --- */}
                {tab === 'CLIENTS' && (
                    <div>
                        <div className="flex justify-between mb-6">
                            <h2 className="text-lg font-semibold">Mis Clientes</h2>
                            <button 
                                onClick={() => setEditingClient({ codigo_pais: 'ES' })}
                                className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Cliente
                            </button>
                        </div>

                        {editingClient ? (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 animate-slide-up">
                                <h3 className="font-semibold mb-4">{editingClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input 
                                        placeholder="Nombre Fiscal" 
                                        value={editingClient.nombre || ''}
                                        onChange={e => setEditingClient({...editingClient, nombre: e.target.value})}
                                        className="p-2 border rounded"
                                    />
                                    <input 
                                        placeholder="NIF" 
                                        value={editingClient.nif || ''}
                                        onChange={e => setEditingClient({...editingClient, nif: e.target.value})}
                                        className="p-2 border rounded"
                                    />
                                    <input 
                                        placeholder="Dirección" 
                                        value={editingClient.direccion || ''}
                                        onChange={e => setEditingClient({...editingClient, direccion: e.target.value})}
                                        className="p-2 border rounded"
                                    />
                                    <select 
                                        value={editingClient.codigo_pais}
                                        onChange={e => setEditingClient({...editingClient, codigo_pais: e.target.value})}
                                        className="p-2 border rounded"
                                    >
                                        <option value="ES">España</option>
                                        <option value="PT">Portugal</option>
                                        <option value="FR">Francia</option>
                                    </select>
                                </div>
                                <div className="mt-4 flex gap-2 justify-end">
                                    <button onClick={() => setEditingClient(null)} className="text-gray-500 px-4 py-2">Cancelar</button>
                                    <button onClick={handleSaveClient} className="bg-brand-600 text-white px-4 py-2 rounded shadow-sm hover:bg-brand-500">Guardar</button>
                                </div>
                            </div>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">NIF</th>
                                        <th className="px-4 py-3">Dirección</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {clients.map(c => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-3 font-medium">{c.nombre}</td>
                                            <td className="px-4 py-3 text-gray-500">{c.nif}</td>
                                            <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{c.direccion}</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => setEditingClient(c)} className="text-gray-400 hover:text-brand-600"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => c.id && handleDeleteClient(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {clients.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">No hay clientes guardados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- CONCEPTS VIEW --- */}
                {tab === 'CONCEPTS' && (
                    <div>
                        <div className="flex justify-between mb-6">
                            <h2 className="text-lg font-semibold">Conceptos Frecuentes</h2>
                            <button 
                                onClick={() => setEditingConcept({ iva_default: 21 })}
                                className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Concepto
                            </button>
                        </div>

                        {editingConcept ? (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 animate-slide-up">
                                <h3 className="font-semibold mb-4">{editingConcept.id ? 'Editar Concepto' : 'Nuevo Concepto'}</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-500">Alias (Nombre corto para selección)</label>
                                        <input 
                                            placeholder="Ej. Hora Consultoría" 
                                            value={editingConcept.alias || ''}
                                            onChange={e => setEditingConcept({...editingConcept, alias: e.target.value})}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-500">Descripción (Aparece en factura)</label>
                                        <textarea 
                                            placeholder="Ej. Servicios de consultoría técnica..." 
                                            value={editingConcept.descripcion || ''}
                                            onChange={e => setEditingConcept({...editingConcept, descripcion: e.target.value})}
                                            className="w-full p-2 border rounded h-20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Precio Base (€)</label>
                                        <input 
                                            type="number"
                                            value={editingConcept.precio_default || ''}
                                            onChange={e => setEditingConcept({...editingConcept, precio_default: parseFloat(e.target.value)})}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">IVA (%)</label>
                                        <select 
                                            value={editingConcept.iva_default}
                                            onChange={e => setEditingConcept({...editingConcept, iva_default: parseFloat(e.target.value)})}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="21">21%</option>
                                            <option value="10">10%</option>
                                            <option value="4">4%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2 justify-end">
                                    <button onClick={() => setEditingConcept(null)} className="text-gray-500 px-4 py-2">Cancelar</button>
                                    <button onClick={handleSaveConcept} className="bg-brand-600 text-white px-4 py-2 rounded shadow-sm hover:bg-brand-500">Guardar</button>
                                </div>
                            </div>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Alias</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3">Precio</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {concepts.map(c => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-3 font-medium">{c.alias}</td>
                                            <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{c.descripcion}</td>
                                            <td className="px-4 py-3 text-gray-500">{c.precio_default}€ + {c.iva_default}%</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => setEditingConcept(c)} className="text-gray-400 hover:text-brand-600"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => c.id && handleDeleteConcept(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {concepts.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">No hay conceptos guardados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DatabaseManager;
