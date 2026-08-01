import { Invoice } from "../models/Invoice.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { logActivity } from "./activity.service.js";
import { generateDocumentNumber } from "../utils.js";

export async function generateInvoice(poId, userId) {
  // Check if invoice already exists for this PO
  const existingInvoice = await Invoice.findOne({ poId });
  if (existingInvoice) {
    return { success: true, data: { id: existingInvoice.id } };
  }

  // Load PO with items
  const po = await PurchaseOrder.findById(poId).populate("vendorId");
  if (!po) return { success: false, error: "Purchase Order not found." };

  // Calculate financials
  const subtotal = po.items.reduce((sum, item) => {
    return sum + Number(item.unitPrice) * Number(item.quantity);
  }, 0);

  const taxAmount = po.items.reduce((sum, item) => {
    const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
    return sum + (itemSubtotal * Number(item.taxPercentage)) / 100;
  }, 0);

  const grandTotal = subtotal + taxAmount;

  // Generate invoice number
  const invoiceCount = await Invoice.countDocuments();
  const invoiceNumber = generateDocumentNumber("INV", invoiceCount);

  const invoice = await Invoice.create({
    invoiceNumber,
    poId:      po._id,
    vendorId:  po.vendorId,
    subtotal,
    taxAmount,
    grandTotal,
    status:   "GENERATED",
    issuedAt: new Date(),
  });

  await logActivity({
    userId,
    action:   "INVOICE_GENERATED",
    module:   "INVOICE",
    entityId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal, poId },
  });

  return { success: true, data: { id: invoice.id } };
}
