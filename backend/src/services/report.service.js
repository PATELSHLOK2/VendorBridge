import { RFQ } from "../models/RFQ.js";
import { Approval } from "../models/Approval.js";
import { Vendor } from "../models/Vendor.js";
import { Invoice } from "../models/Invoice.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";

export async function getDashboardKPIs() {
  const [activeRFQs, pendingApprovals, vendorCount, spendResult] = await Promise.all([
    RFQ.countDocuments({ status: { $in: ["DRAFT", "PUBLISHED"] } }),
    Approval.countDocuments({ status: "PENDING" }),
    Vendor.countDocuments({ status: "ACTIVE" }),
    Invoice.aggregate([
      { $match: { status: { $ne: "GENERATED" } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
  ]);

  return {
    activeRFQs,
    pendingApprovals,
    vendorCount,
    totalSpend: spendResult[0]?.total ?? 0,
  };
}

export async function getReportKPIs() {
  const [spendResult, activeVendors, rfqsProcessed, pendingApprovals] = await Promise.all([
    Invoice.aggregate([{ $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
    Vendor.countDocuments({ status: "ACTIVE" }),
    RFQ.countDocuments({ status: "CLOSED" }),
    Approval.countDocuments({ status: "PENDING" }),
  ]);

  return {
    totalSpend: spendResult[0]?.total ?? 0,
    activeVendors,
    rfqsProcessed,
    pendingApprovals,
  };
}

export async function getSpendByCategory() {
  const data = await Invoice.aggregate([
    {
      $lookup: {
        from: "purchaseorders",
        localField: "poId",
        foreignField: "_id",
        as: "purchaseOrder",
      },
    },
    { $unwind: "$purchaseOrder" },
    {
      $lookup: {
        from: "rfqs",
        localField: "purchaseOrder.rfqId",
        foreignField: "_id",
        as: "rfq",
      },
    },
    { $unwind: "$rfq" },
    {
      $group: {
        _id: { $ifNull: ["$rfq.category", "Uncategorized"] },
        total: { $sum: "$grandTotal" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, category: "$_id", total: 1 } },
  ]);

  return data;
}

export async function getTopVendors(limit = 5) {
  const data = await PurchaseOrder.aggregate([
    {
      $lookup: {
        from: "invoices",
        localField: "_id",
        foreignField: "poId",
        as: "invoice",
      },
    },
    { $unwind: "$invoice" },
    {
      $group: {
        _id: "$vendorId",
        totalSpend: { $sum: "$invoice.grandTotal" },
        poCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "vendors",
        localField: "_id",
        foreignField: "_id",
        as: "vendor",
      },
    },
    { $unwind: "$vendor" },
    { $sort: { totalSpend: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        vendorName: "$vendor.vendorName",
        companyName: "$vendor.companyName",
        totalSpend: 1,
        poCount: 1,
      },
    },
  ]);

  return data;
}

export async function getMonthlySpendTrend(year) {
  const targetYear = year ?? new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear + 1, 0, 1);

  const data = await Invoice.aggregate([
    { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$grandTotal" },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: "$_id", total: 1 } },
  ]);

  return data;
}
