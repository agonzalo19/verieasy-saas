
import { FacturaDraft, VerifactuResponse, EstadoFactura, UserProfile } from '../types';

// In a real app, this would use the API Key from Supabase/Env
const API_BASE_URL = "https://api.verifacti.com/verifactu";

// --- MOCK DATABASE STATE FOR VALIDATION ---
// Initialized empty, filled via interactions
let mockInvoicesDB: VerifactuResponse[] = [];

/**
 * Creates a Proforma (Quote) without VeriFactu hashes/QR
 */
export const createProforma = async (draft: FacturaDraft): Promise<VerifactuResponse> => {
    console.log("Saving Proforma...", draft);
    await new Promise(resolve => setTimeout(resolve, 800)); // Delay

    const newProforma: VerifactuResponse = {
        uuid: crypto.randomUUID(),
        nif_emisor: draft.emisor_nif,
        num_serie: "PRO-BORRADOR", // Temp ID
        fecha_expedicion: draft.fecha_expedicion,
        
        cliente_nombre: draft.cliente.nombre,
        cliente_nif: draft.cliente.nif,
        cliente_direccion: draft.cliente.direccion,
        importe_total: draft.importe_total,
        lineas: draft.lineas,
        base_imponible: draft.base_imponible_total,
        cuota_iva: draft.importe_iva_total,
        cuota_irpf: draft.importe_irpf_total,
        metodo_pago: draft.metodo_pago,
        condiciones_pago: draft.condiciones_pago,
        iban: draft.iban_emisor || '',
        
        estado: EstadoFactura.PROFORMA, 
        
        // No VeriFactu data yet
        url: "",
        qr: "",
        hash_anterior: "",
        hash_propio: ""
    };

    mockInvoicesDB.unshift(newProforma);
    return newProforma;
};

/**
 * Simulates sending the email via platform generic sender
 */
export const sendProformaEmail = async (invoiceId: string, profile: UserProfile): Promise<VerifactuResponse> => {
    console.log(`Sending email for ${invoiceId}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const invoiceIndex = mockInvoicesDB.findIndex(inv => inv.uuid === invoiceId);
    if (invoiceIndex === -1) throw new Error("Documento no encontrado");

    const invoice = mockInvoicesDB[invoiceIndex];
    const token = crypto.randomUUID(); // Generate approval token

    // SIMULATE EMAIL CONSTRUCTION
    const approvalLink = `https://mi-saas.com/approve/${token}`;
    let subject = profile.email_proforma_asunto || "Presupuesto [NUMERO_DOC]";
    let body = profile.email_proforma_cuerpo || "Hola [NOMBRE_CLIENTE], adjunto presupuesto por valor de [IMPORTE_TOTAL]. Clic aquí para aprobar: [ENLACE_APROBACION]";

    // Replace Variables
    subject = subject.replace("[NUMERO_DOC]", invoice.num_serie).replace("[NOMBRE_CLIENTE]", invoice.cliente_nombre);
    body = body
        .replace("[NOMBRE_CLIENTE]", invoice.cliente_nombre)
        .replace("[IMPORTE_TOTAL]", invoice.importe_total + "€")
        .replace("[ENLACE_APROBACION]", approvalLink);

    console.log(`
    --- EMAIL SIMULATION ---
    FROM: no-reply@verieasy.com
    TO: ${invoice.cliente_nif}@email-cliente.com
    REPLY-TO: ${profile.email_contacto} (CRITICAL)
    SUBJECT: ${subject}
    BODY: \n${body}
    ATTACHMENT: Proforma_${invoice.uuid}.pdf
    ------------------------
    `);

    // Update DB with token
    const updatedInvoice = { 
        ...invoice, 
        token_aprobacion: token,
        fecha_envio_email: new Date().toISOString()
    };
    mockInvoicesDB[invoiceIndex] = updatedInvoice;

    return updatedInvoice;
};

/**
 * ATOMIC CONVERSION: Triggered by client approval (token) or manual convert
 * This executes the logic of 'emitir_factura_final'
 */
export const approveProforma = async (tokenOrId: string, seriesConfig: {code: string, current_number: number}): Promise<VerifactuResponse> => {
    console.log("Approving proforma and converting to Legal Invoice...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Atomic transaction simulation

    const invoiceIndex = mockInvoicesDB.findIndex(inv => inv.uuid === tokenOrId || inv.token_aprobacion === tokenOrId);
    if (invoiceIndex === -1) throw new Error("Proforma no encontrada o token inválido");

    const draft = mockInvoicesDB[invoiceIndex];

    // 1. ATOMIC: Assign Number (SNC)
    const officialSerie = seriesConfig.code;
    const officialNumber = seriesConfig.current_number.toString();
    const fullNumber = `${officialSerie}-${officialNumber}`;

    // 2. ATOMIC: Find Previous Hash (Chain)
    const previousInSeries = mockInvoicesDB
        .filter(inv => inv.num_serie.startsWith(officialSerie) && inv.estado !== EstadoFactura.PROFORMA)
        .sort((a, b) => b.fecha_expedicion.localeCompare(a.fecha_expedicion))[0];

    const mockHashAnterior = previousInSeries ? previousInSeries.hash_propio : "0".repeat(64);

    // 3. ATOMIC: Calculate Hash
    const payload = `${draft.nif_emisor}${fullNumber}${draft.importe_total}${mockHashAnterior}`;
    const mockHashPropio = btoa(payload).substring(0, 32).toUpperCase();

    // 4. PERSIST
    const finalInvoice: VerifactuResponse = {
        ...draft,
        num_serie: fullNumber,
        estado: EstadoFactura.CORRECTO,
        url: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?mock=true",
        qr: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgZQsAAAAASUVORK5CYII=", 
        hash_anterior: mockHashAnterior,
        hash_propio: mockHashPropio,
        token_aprobacion: undefined // consume token
    };

    mockInvoicesDB[invoiceIndex] = finalInvoice;
    
    // In a real app, here we would trigger the "Invoice Issued" email
    console.log("Invoice Issued Email triggered automatically.");

    return finalInvoice;
};


/**
 * Standard creation (Direct Invoice)
 */
export const createFactura = async (draft: FacturaDraft): Promise<VerifactuResponse> => {
    // If user wants a Proforma, divert logic
    if (draft.is_proforma) {
        return createProforma(draft);
    }

    console.log("Creating Direct Invoice...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate finding the series from draft (in real app, passed via args or DB)
    const previousInSeries = mockInvoicesDB
        .filter(inv => inv.num_serie.startsWith(draft.serie) && inv.estado !== EstadoFactura.PROFORMA)
        .sort((a, b) => b.fecha_expedicion.localeCompare(a.fecha_expedicion))[0];

    const mockHashAnterior = previousInSeries ? previousInSeries.hash_propio : "0".repeat(64);
    const payload = `${draft.emisor_nif}${draft.serie}${draft.numero}${draft.importe_total}${mockHashAnterior}`;
    const mockHashPropio = btoa(payload).substring(0, 32).toUpperCase();

    const newInvoice: VerifactuResponse = {
        uuid: crypto.randomUUID(),
        nif_emisor: draft.emisor_nif,
        num_serie: `${draft.serie}-${draft.numero}`,
        fecha_expedicion: draft.fecha_expedicion,
        cliente_nombre: draft.cliente.nombre,
        cliente_nif: draft.cliente.nif,
        cliente_direccion: draft.cliente.direccion,
        importe_total: draft.importe_total,
        lineas: draft.lineas,
        base_imponible: draft.base_imponible_total,
        cuota_iva: draft.importe_iva_total,
        cuota_irpf: draft.importe_irpf_total,
        metodo_pago: draft.metodo_pago,
        condiciones_pago: draft.condiciones_pago,
        iban: draft.iban_emisor || '',
        estado: EstadoFactura.CORRECTO, // Simulating auto-correct for demo
        url: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?mock=true",
        qr: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgZQsAAAAASUVORK5CYII=",
        hash_anterior: mockHashAnterior,
        hash_propio: mockHashPropio
    };
    mockInvoicesDB.unshift(newInvoice);
    return newInvoice;
};

/**
 * Handles Logic Cancellation (Anulación)
 */
export const cancelFactura = async (invoice: VerifactuResponse, reason: string): Promise<VerifactuResponse> => {
    console.log("Attempting cancellation...", invoice.num_serie);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. EXTRACT SERIES
    // Assumes format "SERIE-NUMERO" e.g. "A-2025-105"
    const seriesCode = invoice.num_serie.split('-').slice(0, 2).join('-'); 

    // 2. VALIDATION: Check if it is the LAST invoice in the mock DB for this series
    // In a real DB, we would do a "SELECT ... ORDER BY numero DESC LIMIT 1" with lock
    const lastInSeries = mockInvoicesDB
        .filter(inv => inv.num_serie.startsWith(seriesCode) && inv.estado !== EstadoFactura.PROFORMA && inv.estado !== EstadoFactura.ANULADA)
        .sort((a, b) => b.num_serie.localeCompare(a.num_serie))[0];

    if (lastInSeries && lastInSeries.uuid !== invoice.uuid) {
        // ERROR: Not the last one
        throw new Error("NOT_LAST_INVOICE");
    }

    // 3. EXECUTE CANCELLATION
    const updated = { 
        ...invoice, 
        estado: EstadoFactura.ANULADA, 
        importe_total: "0.00",
        // In real VeriFactu, we would append a cancellation record. 
        // Here we just update the status for the UI.
    };
    
    // Update Mock DB
    const idx = mockInvoicesDB.findIndex(i => i.uuid === invoice.uuid);
    if(idx !== -1) mockInvoicesDB[idx] = updated;

    return updated;
};
