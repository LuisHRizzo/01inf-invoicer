import React from 'react';
import type { Invoice, Customer } from '../types';

interface InvoicePreviewProps {
    invoice: Invoice;
    customer: Customer | null;
}

// Color púrpura oscuro de la imagen
const PURPLE_DARK = 'bg-[#4B2983]';
const PURPLE_LIGHT = 'bg-[#EAE4F3]';

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, customer }) => {

    const formatDate = (dateString: string | Date | null | undefined) => {
        if (!dateString) return '';

        let date: Date;
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            date = new Date(`${year}-${month}-${day}T00:00:00`);
        } else {
            date = new Date(dateString);
        }

        if (Number.isNaN(date.getTime())) return '';
        // Ajuste para el offset de la zona horaria del usuario
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        // Formato DD/MM/YYYY (como en la imagen)
        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (amount: number) => {
        // En la imagen no se ve el símbolo de moneda, solo el formato de miles y decimales
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Cálculos de la factura (dejamos los tuyos)
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;
    const shippingHandling = 0.00;
    const other = 0.00;

    // Datos por defecto si el cliente es null (simulando los datos de la imagen)
    const defaultCustomerData = {
        name: '01infinito LLC placeholder',
        addressLine1: '123 Main Street',
    };

    // Función para manejar saltos de línea en el campo de Notas
    const renderNotes = (notes: string) => {
        // Reemplazamos \n por <br />
        return notes.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    // FUNCIÓN CORREGIDA PARA RENDERIZAR LA DIRECCIÓN DEL CLIENTE
    const renderCustomerAddress = (customer: Customer | null) => {
        // Si no hay cliente, usa los datos por defecto
        if (!customer) {
            return (
                <>
                    <p className="font-semibold">Company Name: {defaultCustomerData.name}</p>
                    <p>{defaultCustomerData.addressLine1}</p>
                
                </>
            );
        }

        // Si hay cliente, usamos sus datos dinámicos
        const addressParts = customer.address ? customer.address.split(', ').filter(p => p.trim() !== '') : [];
        const addressLine1 = addressParts[0];
        // Si hay más de una parte, el resto va a la segunda línea
        const addressLine2 = addressParts.length > 1 ? addressParts.slice(1).join(', ') : null;

        return (
            <>                             
                <p className="font-semibold">Company Name: {customer.name}</p>
                
                {/* Primera línea de dirección: solo se muestra si existe */}
                {addressLine1 && <p>{addressLine1}</p>}

                {/* Segunda línea de dirección (resto después de la coma): solo se muestra si existe */}
                {addressLine2 && <p>{addressLine2}</p>}
                <p className="font-semibold"> Tax ID / EIN: {customer.taxId}</p>
            </>
        );
    };

    // --- Estructura y Estilos de la Imagen ---
    return (
        <div className="font-sans text-xs text-gray-800 p-4 border border-gray-300 w-[7.0in] mx-auto bg-white shadow-xl print:shadow-none print:border-none">
            
            {/* Header: LOGO/TITLE + INFO DE FACTURA */}
            <header className="flex justify-between items-start">
                <div className="w-1/2">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 uppercase">INVOICE</h1>
                </div>
                
                {/* Bloques de Fecha, No. de Factura, etc. */}
                <div className="w-1/2 flex flex-col items-end">
                    <div className="w-full grid grid-cols-2">
                        {/* Fila DATE */}
                        <div className="py-1 px-2 border border-gray-200">DATE</div>
                        <div className={`py-1 px-2 ${PURPLE_DARK} text-white font-semibold text-right`}>
                            {formatDate(invoice.date)}
                        </div>
                        {/* Fila INVOICE NO. */}
                        <div className="py-1 px-2 border border-gray-200">INVOICE NO.</div>
                        <div className={`py-1 px-2 ${PURPLE_DARK} text-white font-semibold text-right`}>
                            {invoice.invoiceNumber || 'N/A'}
                        </div>
                        {/* Fila CUSTOMER NO. */}
                        <div className="py-1 px-2 border border-gray-200">CUSTOMER NO.</div>
                        <div className={`py-1 px-2 ${PURPLE_DARK} text-white font-semibold text-right`}>
                            {/* Usamos el taxId como un Customer No. */}
                            {customer?.taxId || "001"}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Información de la Compañía (Tu Empresa) */}
            <section className="mt-4 pb-4 border-b border-gray-300">
                <p className="text-sm font-bold text-gray-900">Company Name: 01 INFINITO LLC</p>
                <p>407 LINCOLN RD SUITE 11K</p>
                <p>MIAMI BEACH, FL 33139</p>
                <p>Email Address: secceconi@01infinito.com</p>
                <p>Point of Contact</p>
            </section>

            {/* BILL TO / SHIP TO */}
            <section className="grid grid-cols-2 gap-4 mt-4">
                {/* BILL TO (FACTURAR A) */}
                <div className="pr-4">
                    <div className={`${PURPLE_DARK} text-white font-semibold p-1`}>BILL TO:</div>
                    <div className="p-2 border border-gray-200 h-[100px]">
                        {renderCustomerAddress(customer)}
                    </div>
                </div>

                {/* SHIP TO (ENVIAR A) - Usamos la misma lógica que BILL TO */}
                <div>
                    <div className={`${PURPLE_DARK} text-white font-semibold p-1`}>SHIP TO:</div>
                    <div className="p-2 border border-gray-200 h-[100px]">
                        {renderCustomerAddress(customer)}
                    </div>
                </div>
            </section>
            
            {/* Secciones de SHIPPING/PAYMENT (Campos vacíos como en la imagen) */}
            <section className="grid grid-cols-5 gap-0 mt-4 border border-gray-200">
                <div className={`col-span-1 ${PURPLE_DARK} text-white font-semibold p-1 text-center border-r border-white`}>SHIP VIA</div>
                <div className={`col-span-1 ${PURPLE_DARK} text-white font-semibold p-1 text-center border-r border-white`}>SHIPPING TERMS</div>
                <div className={`col-span-1 ${PURPLE_DARK} text-white font-semibold p-1 text-center border-r border-white`}>PAYMENT</div>
                <div className={`col-span-1 ${PURPLE_DARK} text-white font-semibold p-1 text-center border-r border-white`}>DELIVERY DATE</div>
                <div className={`col-span-1 ${PURPLE_DARK} text-white font-semibold p-1 text-center`}>-</div>
                
                <div className="col-span-1 p-1 text-center border-r border-gray-200">-</div>
                <div className="col-span-1 p-1 text-center border-r border-gray-200">-</div>
                <div className="col-span-1 p-1 text-center border-r border-gray-200">-</div>
                <div className="col-span-1 p-1 text-center border-r border-gray-200">-</div>
                <div className="col-span-1 p-1 text-center">-</div>
            </section>

            {/* TABLA DE ITEMS y TOTALES */}
            <section className="mt-4 flex">
                
                {/* Columna Izquierda: Items y Notas */}
                <div className="w-3/5 pr-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={PURPLE_DARK + ' text-white'}>
                                <th className="p-1 text-center w-10">ITEM NO.</th>
                                <th className="p-1 w-3/5">DESCRIPTION</th>
                                <th className="p-1 text-center">QTY</th>
                                <th className="p-1 text-right">UNIT PRICE</th>
                                <th className="p-1 text-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 1 ? PURPLE_LIGHT : ''}>
                                    <td className="p-1 text-center align-top">{index + 1}</td>
                                    <td className="p-1 align-top">{item.description}</td>
                                    <td className="p-1 text-center align-top">{item.quantity}</td>
                                    <td className="p-1 text-right align-top">{formatCurrency(item.price)}</td>
                                    <td className="p-1 text-right font-semibold align-top">{formatCurrency(item.quantity * item.price)}</td>
                                </tr>
                            ))}
                            {/* Relleno con filas vacías para que se parezca a la imagen */}
                            {Array(Math.max(6 - invoice.items.length, 0)).fill(null).map((_, index) => (
                                <tr key={`filler-${index}`} className={(invoice.items.length + index) % 2 === 1 ? PURPLE_LIGHT : ''}>
                                    <td className="p-1 text-center">&nbsp;</td>
                                    <td className="p-1"></td>
                                    <td className="p-1"></td>
                                    <td className="p-1"></td>
                                    <td className="p-1"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Sección de Notas / Instrucciones */}
                    <div className="mt-2">
                        <p className="font-bold text-xs">Remarks / Instructions:</p>
                        <div className="mt-1 p-2 border border-gray-300 min-h-20">
                            {/* NOTAS: Aplicamos el formato de multilínea */}
                            <div className="text-xs">
                                {invoice.notes && renderNotes(invoice.notes)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Totales */}
                <div className="w-2/5 border border-gray-300">
                    <div className={`${PURPLE_DARK} text-white grid grid-cols-2`}>
                        <div className="p-1 font-semibold border-r border-white">SUBTOTAL</div>
                        <div className="p-1 text-right font-semibold">{formatCurrency(subtotal)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2">
                        {/* TAX */}
                        <div className="p-1 border-r border-gray-300">TAX {invoice.taxRate}%</div>
                        <div className="p-1 text-right">{formatCurrency(taxAmount)}</div>
                        {/* SHIPPING / HANDLING */}
                        <div className="p-1 border-r border-gray-300">SHIPPING / HANDLING</div>
                        <div className="p-1 text-right">{formatCurrency(shippingHandling)}</div>
                    </div>
                    
                    {/* Área vacía grande púrpura, luego OTHER y TOTAL */}
                    <div className={PURPLE_LIGHT + ' h-16 p-1 flex flex-col justify-end'}>
                        <div className="grid grid-cols-2">
                            <div className="p-1 font-bold border-r border-gray-300">OTHER</div>
                            <div className="p-1 text-right font-bold">{formatCurrency(other)}</div>
                        </div>
                    </div>

                    <div className={`${PURPLE_DARK} text-white grid grid-cols-2`}>
                        <div className="p-2 font-bold text-lg border-r border-white">TOTAL</div>
                        <div className="p-2 text-right font-bold text-lg">{formatCurrency(total)}</div>
                    </div>
                </div>

            </section>

            {/* Footer con firma y datos de contacto */}
            <footer className="mt-4">
                <div className={`${PURPLE_DARK} text-white grid grid-cols-2 text-center`}>
                    <div className="p-1 font-semibold border-r border-white">DATE</div>
                    <div className="p-1 font-semibold">AUTHORIZED SIGNATURE</div>
                </div>
                <div className="grid grid-cols-2 text-center text-xs">
                    <div className="p-1 border border-gray-300 border-t-0 border-r-0">{formatDate(invoice.date)}</div>
                    <div className="p-1 border border-gray-300 border-t-0 font-semibold">
                        {customer?.contactPerson || 'SEBASTIAN CECCONI'}
                    </div>
                </div>
                
                <div className="mt-2 text-center text-xs">
                    <p>For questions concerning this purchase order, please contact</p>
                    <p className="font-semibold">Sebastian Cecconi, secceconi@01infinito.com</p>
                    <p className="mt-1 font-semibold text-blue-600">www.01infinito.com</p>
                </div>
            </footer>
        </div>
    );
};

export default InvoicePreview;
