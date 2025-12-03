
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import InvoiceWizard from './components/InvoiceWizard';
import Settings from './components/Settings';
import DatabaseManager from './components/DatabaseManager';
import { VerifactuResponse, UserProfile, Cliente, SavedConcept } from './types';

// Mock initial data
const INITIAL_PROFILE: UserProfile = {
    nif: '77777777B',
    nombre_fiscal: 'Diseños Freelance S.L.',
    direccion: 'Calle Mayor 1, 28013 Madrid',
    iban: 'ES91 0000 0000 0000 0000 1234',
    logo_url: '',
    brand_color: '#0ea5e9',
    series: [
        { code: 'A-2025', current_number: 105 },
        { code: 'B-2025', current_number: 1 },
        { code: 'R-2025', current_number: 1 }
    ],
    // Default Email Settings
    email_contacto: 'hola@disenos-freelance.com',
    email_proforma_asunto: 'Presupuesto: [NUMERO_DOC]',
    email_proforma_cuerpo: 'Hola [NOMBRE_CLIENTE],\n\nAdjunto encontrarás el presupuesto solicitado por un total de [IMPORTE_TOTAL].\n\nPuedes aprobarlo directamente haciendo clic en el siguiente enlace:\n[ENLACE_APROBACION]\n\nUn saludo.'
};

const INITIAL_CLIENTS: Cliente[] = [
    { id: '1', nombre: 'Tech Corp S.A.', nif: 'A11111111', codigo_pais: 'ES', direccion: 'Parque Tecnológico 4, Barcelona' },
    { id: '2', nombre: 'Panadería Pepe', nif: 'B22222222', codigo_pais: 'ES', direccion: 'Plaza del Pueblo 5, Valencia' }
];

const INITIAL_CONCEPTS: SavedConcept[] = [
    { id: '1', alias: 'Hora Desarrollo', descripcion: 'Hora de desarrollo de software senior', precio_default: 60, iva_default: 21 },
    { id: '2', alias: 'Consultoría Mensual', descripcion: 'Mantenimiento y consultoría recurrente', precio_default: 250, iva_default: 21 }
];

type ViewState = 'DASHBOARD' | 'WIZARD' | 'SETTINGS' | 'DATABASE';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('DASHBOARD');
    const [invoices, setInvoices] = useState<VerifactuResponse[]>([]);
    
    // Global State for "SaaS" features
    const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
    const [savedClients, setSavedClients] = useState<Cliente[]>(INITIAL_CLIENTS);
    const [savedConcepts, setSavedConcepts] = useState<SavedConcept[]>(INITIAL_CONCEPTS);
    const [rectificationSource, setRectificationSource] = useState<VerifactuResponse | null>(null);

    const handleInvoiceSuccess = (newInvoice: VerifactuResponse) => {
        setInvoices([newInvoice, ...invoices]);
        
        // Auto-increment series number IF it's a real invoice (not proforma)
        if (newInvoice.estado !== 'Proforma') {
            const updatedSeries = profile.series.map(s => {
                if (newInvoice.num_serie.startsWith(s.code)) {
                    return { ...s, current_number: s.current_number + 1 };
                }
                return s;
            });
            setProfile({ ...profile, series: updatedSeries });
        }
        
        setRectificationSource(null);
        setView('DASHBOARD');
    };

    // Callback to add a new concept from the Wizard on the fly
    const handleAddConcept = (newConcept: SavedConcept) => {
        setSavedConcepts(prev => [...prev, newConcept]);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {view === 'DASHBOARD' && (
                <Dashboard 
                    invoices={invoices}
                    profile={profile}
                    onStartNew={() => {
                        setRectificationSource(null);
                        setView('WIZARD');
                    }} 
                    onOpenSettings={() => setView('SETTINGS')}
                    onOpenDatabase={() => setView('DATABASE')}
                    onRectify={(invoice) => {
                        setRectificationSource(invoice);
                        setView('WIZARD');
                    }}
                />
            )}

            {view === 'WIZARD' && (
                <InvoiceWizard 
                    profile={profile}
                    savedClients={savedClients}
                    savedConcepts={savedConcepts}
                    onCancel={() => {
                        setRectificationSource(null);
                        setView('DASHBOARD');
                    }}
                    onSuccess={handleInvoiceSuccess}
                    onSaveConcept={handleAddConcept}
                    rectificationSource={rectificationSource}
                />
            )}

            {view === 'SETTINGS' && (
                <Settings 
                    profile={profile}
                    onSave={(p) => { setProfile(p); setView('DASHBOARD'); }}
                    onBack={() => setView('DASHBOARD')}
                />
            )}

            {view === 'DATABASE' && (
                <DatabaseManager 
                    clients={savedClients}
                    concepts={savedConcepts}
                    onUpdateClients={setSavedClients}
                    onUpdateConcepts={setSavedConcepts}
                    onBack={() => setView('DASHBOARD')}
                />
            )}
        </div>
    );
};

export default App;
