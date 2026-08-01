import { Approval } from "../models/Approval.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { Quotation } from "../models/Quotation.js";
import { logActivity } from "./activity.service.js";
import { generateDocumentNumber } from "../utils.js";

export async function generatePurchaseOrder(approvalId, userId) {
  // Load the approval with nested data
  const approval = await Approval.findById(approvalId)
    .populate({
      path: "quotationId",
      populate: [
        { path: "vendorId" },
        { path: "items.rfqItemId" },
      ],
    })
    .populate("rfqId");

  if (!approval) return { success: false, error: "Approval not found." };
  if (approval.status !== "APPROVED") {
    return { success: false, error: "Cannot generate PO for non-approved request." };
  }

  // Check if PO exists already
  const existingPO = await PurchaseOrder.findOne({ approvalId });
  if (existingPO) return { success: true, data: { id: existingPO.id } };

  const quotation = await Quotation.findById(approval.quotationId);
  if (!quotation) return { success: false, error: "Quotation not found." };

  // Generate PO number
  const poCount = await PurchaseOrder.countDocuments();
  const poNumber = generateDocumentNumber("PO", poCount);

  const po = await PurchaseOrder.create({
    poNumber,
    approvalId: approval._id,
    vendorId:   quotation.vendorId,
    rfqId:      approval.rfqId,
    status:     "ISSUED",
    issueDate:  new Date(),
    createdById: userId,
    items: quotation.items.map((item) => ({
      itemName:      item.rfqItemId?.itemName ?? "Item",
      quantity:      Number(item.quantity),
      unitPrice:     Number(item.unitPrice),
      taxPercentage: Number(item.taxPercentage),
      totalAmount:   Number(item.totalAmount),
    })),
  });

  await logActivity({
    userId,
    action:   "PO_GENERATED",
    module:   "PURCHASE_ORDER",
    entityId: po.id,
    metadata: { poNumber: po.poNumber, approvalId },
  });

  return { success: true, data: { id: po.id } };
}
