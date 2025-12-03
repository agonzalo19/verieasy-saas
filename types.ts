// types/index.ts

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
    PROFORMA = "PROFORMA", // Coincide con el Enum de SQL
    PENDIENTE = "Pendiente",
    CORRECTO = "Correcto",
    ACEPTADO_CON_ERRORES = "AceptadoConErrores",
    INCORRECTO = "Incorrecto",
    ANULADA = "Anulada",
    EMITIDA = "EMITIDA" // Coincide con el Enum de SQL
}

// Line item structure
export interface FacturaLinea {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    
    // Calculated fields required by API
    base_imponible: string; 
    tipo_impositivo: string; 
    impuesto: TipoImpuesto;
    cuota_repercutida: string; 
}

// Client structure
export interface Cliente {
    id?: string; // Optional for new clients
    nif: string;
    nombre: string;
    direccion: string; 
    codigo_pais: string; 
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
    
    is_proforma: boolean; 

    // --- Rectifying Data (VeriFactu) ---
    rectificativa_referencia?: string; 
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
    irpf_porcentaje: number; 
    importe_irpf_total: string;

    importe_total: string; 
    
    // --- Commercial Data ---
    condiciones_pago: string; 
    metodo_pago: string; 
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
    num_serie: string; 
    fecha_expedicion: string;
    cliente_nombre: string;
    cliente_nif: string;
    cliente_direccion: string;
    importe_total: string;
    
    // VeriFactu Traceability
    url: string; 
    qr: string; 
    hash_anterior: string; 
    hash_propio: string; 
    
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
    alias: string; 
    descripcion: string;
    precio_default: number;
    iva_default: number;
}

// Corresponde a la tabla 'user_profiles' en Supabase
export interface UserProfile {
    user_id: string; // Añadido para hacer el fetch más fácil
    nif: string;
    nombre_fiscal: string;
    direccion: string;
    iban: string; 
    logo_url: string;
    brand_color: string;
    // Las series de numeración deben cargarse de la tabla 'configuracion_series' por separado
    
    // --- CONFIGURACIÓN CRÍTICA (FEATURE FLAG) ---
    verifactu_activo: boolean; // <--- ¡CORRECCIÓN CRÍTICA!
    
    // --- EMAIL SETTINGS ---
    email_contacto: string; 
    email_proforma_asunto: string;
    email_proforma_cuerpo: string;
}