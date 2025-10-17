import { useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildInvoicePdfDefinition } from "../../utils/pdfDefinition";
import { Invoice, Customer } from "../types";
import { sanitizeInvoice } from "../../utils/invoiceHelpers";

const resolvedFonts =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfFonts as any)?.pdfMake?.vfs ?? (pdfFonts as any)?.vfs ?? pdfFonts;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = resolvedFonts;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

export const useInvoicePdf = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const exportInvoiceToPdf = async (invoice: Invoice, customer: Customer | null) => {
    setIsGeneratingPdf(true);
    try {
      const sanitizedInvoice = sanitizeInvoice(invoice);
      const docDefinition = buildInvoicePdfDefinition(sanitizedInvoice, customer);
      await new Promise<void>((resolve) => {
        pdfMake
          .createPdf(docDefinition)
          .download(`Factura-${invoice.invoiceNumber}.pdf`, () => resolve());
      });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    isGeneratingPdf,
    exportInvoiceToPdf,
  };
};