
// Enum values based on the PDF documentation
export enum TipoFactura {
    F1 = "F1", // Factura ordinaria
    F2 = "F2", // Factura simplificada
    R1 = "R1", // Rectificativa (Error fundado)
    R2 = "R2", // Rectificativa (Art 80.3)
    R3 = "R3", // Rectificativa (Art 80.4)
    R4 = "R4", // Rectificativa (Resto)
}

export enum TipoImpuesto {
    IVA = "01",
    IPSI = "02",
    IGIC = "03",
    OTROS = "05"
}

export enum EstadoFactura {
    PROFORMA = "Proforma", // New Status
    PENDIENTE = "Pendiente",
    CORRECTO = "Correcto",
    ACEPTADO_CON_ERRORES = "AceptadoConErrores",
    INCORRECTO = "Incorrecto",
    ANULADA = "Anulada"
}

// Line item structure
export interface FacturaLinea {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    
    // Calculated fields required by API
    base_imponible: string; // (cantidad * precio)
    tipo_impositivo: string; // "21", "10", "4", "0"
    impuesto: TipoImpuesto;
    cuota_repercutida: string; // (base * tipo / 100)
}

// Client structure
export interface Cliente {
    id?: string; // Optional for new clients
    nif: string;
    nombre: string;
    direccion: string; // Made mandatory for F1
    codigo_pais: string; // ISO 3166-1 alpha-2 (e.g., "ES")
    email?: string;
}

// Main Invoice structure matching the internal logic + API needs
export interface FacturaDraft {
    // --- Identification ---
    serie: string;
    numero: string;
    fecha_expedicion: string; // DD-MM-YYYY
    fecha_operacion?: string;
    tipo_factura: TipoFactura;
    
    is_proforma: boolean; // Flag to determine creation path

    // --- Rectifying Data (VeriFactu) ---
    rectificativa_referencia?: string; // Num of original invoice
    rectificativa_motivo?: string;

    // --- Participants ---
    emisor_nif: string; 
    cliente: Cliente;
    
    // --- Lines & Math ---
    lineas: FacturaLinea[];
    base_imponible_total: string;
    importe_iva_total: string;
    
    // --- IRPF (Professional Retention) ---
    aplicar_irpf: boolean;
    irpf_porcentaje: number; // e.g. 15 or 7
    importe_irpf_total: string;

    importe_total: string; // (Base + IVA - IRPF)
    
    // --- Commercial Data ---
    condiciones_pago: string; // e.g., "Vencimiento a 30 días"
    metodo_pago: string; // e.g., "Transferencia", "Bizum"
    iban_emisor?: string;
    vigencia_oferta?: string;

    // --- Branding ---
    color_hex: string;
    logo_url?: string;
}

// API Response simulation
export interface VerifactuResponse {
    uuid: string;
    nif_emisor: string;
    num_serie: string; // If proforma, this might be "PRO-TEMP-001"
    fecha_expedicion: string;
    cliente_nombre: string;
    cliente_nif: string;
    cliente_direccion: string;
    importe_total: string;
    
    // VeriFactu Traceability
    url: string; // Verification URL
    qr: string; // Base64 QR code
    hash_anterior: string; // Hash of previous invoice
    hash_propio: string; // Hash of this invoice
    
    estado: EstadoFactura;
    error_msg?: string;
    
    // Proforma logic
    token_aprobacion?: string;
    fecha_envio_email?: string;

    // Snapshot of data for display/printing
    lineas: FacturaLinea[];
    base_imponible: string;
    cuota_iva: string;
    cuota_irpf: string;
    metodo_pago: string;
    condiciones_pago: string;
    iban: string;
}

// --- NEW TYPES FOR SAAS FEATURES ---

export interface SavedConcept {
    id: string;
    alias: string; // Short name for selection
    descripcion: string;
    precio_default: number;
    iva_default: number;
}

export interface UserProfile {
    nif: string;
    nombre_fiscal: string;
    direccion: string;
    iban: string; // Added IBAN
    logo_url: string;
    brand_color: string;
    series: { code: string; current_number: number }[]; // Track consecutive numbers
    
    // --- EMAIL SETTINGS ---
    email_contacto: string; // Reply-To
    email_proforma_asunto: string;
    email_proforma_cuerpo: string;
}