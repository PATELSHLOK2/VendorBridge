const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// We output directly inside the project root AND on Desktop
const projectRootOutput = path.resolve(__dirname, '../../VendorBridge-Pro-ERP-Documentation.pdf');
const desktopOutput = path.resolve('C:/Users/Shlok patel/OneDrive/Desktop/VendorBridge-Pro-ERP-Documentation.pdf');

function generateDocument(targetPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 65, bottom: 65, left: 50, right: 50 },
      bufferPages: true
    });

    const stream = fs.createWriteStream(targetPath);
    doc.pipe(stream);

    // Color Palette
    const PRIMARY_COLOR = '#1E3A8A';   // Deep Navy Blue
    const SECONDARY_COLOR = '#3B82F6'; // Royal Blue
    const TEXT_DARK = '#1F2937';       // Charcoal
    const TEXT_MUTED = '#4B5563';      // Gray
    const BOX_BG = '#EFF6FF';          // Light Blue Box BG
    const LINE_COLOR = '#E5E7EB';      // Light Gray Divider

    // Title Section
    doc.font('Helvetica-Bold').fontSize(22).fillColor(PRIMARY_COLOR);
    const title = 'VendorBridge';
    const titleW = doc.widthOfString(title);
    const startX = (doc.page.width - titleW) / 2;
    doc.text(title, startX, 75);

    // Title underline accent
    doc.moveTo(startX, 102)
       .lineTo(startX + titleW, 102)
       .lineWidth(2.5)
       .strokeColor(SECONDARY_COLOR)
       .stroke();

    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT_DARK);
    doc.text('AI-Enhanced Procurement & Vendor Management ERP System', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10.5).fillColor(TEXT_MUTED);
    doc.text('Architecture: MERN Stack (MongoDB, Express.js, React.js, Node.js — Plain JavaScript)', { align: 'center' });
    doc.moveDown(1.5);

    // Helper: Section Header with colored box accent
    function drawSectionHeader(num, text) {
      if (doc.y > 680) doc.addPage();
      const y = doc.y;
      doc.rect(50, y, doc.page.width - 100, 24).fill(BOX_BG);
      doc.rect(50, y, 4, 24).fill(PRIMARY_COLOR);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY_COLOR);
      doc.text(`${num}. ${text}`, 62, y + 6);
      doc.y = y + 32;
    }

    // Section 1: PROBLEM STATEMENT
    drawSectionHeader('1', 'PROBLEM STATEMENT');
    doc.font('Helvetica').fontSize(10.5).fillColor(TEXT_DARK).lineGap(4);
    doc.text('Traditional procurement and vendor management methods require organizations to manually search for suppliers, exchange quotations via fragmented emails, compare vendor bids on static spreadsheets, and manually draft purchase orders and invoices. This manual workflow is not only time-consuming and inefficient but also lacks transparency, audit trails, and real-time spending visibility. Without a centralized system, organizations face communication gaps, delayed approvals, pricing errors, undetected quotation collusion, and poor supplier relationship management. There is a strong need for an intelligent, end-to-end platform that automates Request for Quotation (RFQ) workflows, provides structured side-by-side quotation comparisons, ensures transparent multi-level approval hierarchies, and generates official, tax-compliant procurement documentation seamlessly.', { align: 'justify' });
    doc.moveDown(1.2);

    // Section 2: PURPOSE
    drawSectionHeader('2', 'PURPOSE');
    doc.font('Helvetica').fontSize(10.5).fillColor(TEXT_DARK).lineGap(4);
    doc.text('The purpose of VendorBridge is to build a modern, centralized, web-based Procurement and Vendor Management ERP platform that bridges the gap between organizations and their suppliers. It reduces the manual effort involved in vendor discovery, quotation collection, offer evaluation, and financial document generation. By providing role-based portals for procurement officers, managers, and vendors, the system streamlines the entire procurement lifecycle, enhances financial accuracy through automated tax and total calculations, and delivers AI-driven insights into organizational spending, pricing anomalies, and vendor performance.', { align: 'justify' });
    doc.moveDown(1.2);

    // Section 3: CORE OBJECTIVES
    drawSectionHeader('3', 'CORE OBJECTIVES');
    const objectives = [
      { title: 'Automated RFQ Lifecycle', desc: 'To allow procurement officers to create structured Requests for Quotations (RFQs) with specific item quantities, delivery deadlines, and multi-vendor assignments.' },
      { title: 'Dedicated Vendor Portal', desc: 'To provide vendors with a dedicated dashboard to view assigned procurement opportunities and submit standardized quotations with itemized pricing, taxes, and delivery timelines.' },
      { title: 'Side-by-Side Quotation Engine', desc: 'To implement an automated quotation comparison engine that evaluates vendor offers based on unit prices, tax percentages, total costs, and delivery schedules.' },
      { title: 'Multi-Role Access & Security', desc: 'To build a secure, role-based access control (RBAC) system with distinct permissions and workflows for Administrators, Procurement Officers, Managers, and Vendors.' },
      { title: 'Transparent Approvals & Thresholds', desc: 'To establish a transparent management approval workflow where managers can review, approve, or reject selected bids with remarks, including automatic threshold alerts.' },
      { title: 'Automated PO & PDF Invoices', desc: 'To automatically generate standardized Purchase Orders (POs) upon quotation approval and convert them into official, downloadable PDF Invoices with tax breakdowns.' },
      { title: 'Comprehensive Audit Logging', desc: 'To maintain an append-only activity log and audit trail that tracks all system events, mutations, and user activities across modules for complete compliance.' },
      { title: 'Executive Analytics Dashboard', desc: 'To provide an interactive reporting dashboard showing total procurement spend, category distributions, active vendor metrics, and monthly purchasing trends.' }
    ];

    objectives.forEach(obj => {
      if (doc.y > 710) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PRIMARY_COLOR).lineGap(3);
      doc.text('•   ', 54, doc.y, { continued: true });
      doc.text(`${obj.title}: `, { continued: true });
      doc.font('Helvetica').fillColor(TEXT_DARK);
      doc.text(obj.desc, { align: 'justify', width: doc.page.width - 124 });
      doc.moveDown(0.5);
    });
    doc.moveDown(0.8);

    // Section 4: ADVANCED & EXTENDED FEATURE DESCRIPTIONS
    drawSectionHeader('4', 'ADVANCED & EXTENDED FEATURE DESCRIPTIONS');
    
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SECONDARY_COLOR);
    doc.text('A. Core Procurement Workflows', 54, doc.y);
    doc.moveDown(0.5);

    const coreFeatures = [
      { title: 'Role-Based Access Control (RBAC)', desc: 'Separate, customized dashboards and modular access permissions tailored for Administrators, Procurement Officers, Managers, and Vendors.' },
      { title: 'Centralized Vendor Management & GST Verification', desc: 'Directory allowing administrators to register vendors, track company details, verify GST/VAT tax numbers, and manage vendor status (Active, Pending, Blocked, Inactive).' },
      { title: 'RFQ Creation & Multi-Vendor Assignment', desc: 'Officers can draft detailed RFQs, attach line items with specific quantities and units, assign candidate vendors simultaneously, and set submission deadlines.' },
      { title: 'Standardized Itemized Quotation Submission', desc: 'Vendors access assigned RFQs in their portal and submit structured quotations featuring unit pricing, tax rates, delivery schedules, and additional notes.' },
      { title: 'Side-by-Side Quotation Comparison & Selection', desc: 'Officers view all competing vendor bids for an RFQ side-by-side to compare unit pricing, tax breakdown, total cost, and delivery timelines before selecting a winner.' },
      { title: 'Manager Approval Workflow with Remarks', desc: 'Selected quotations automatically enter a pending approval queue where managers evaluate pricing breakdowns and approve or reject requests with audit remarks.' },
      { title: 'Automated Purchase Order (PO) Generation', desc: 'Upon management approval, the system generates an official Purchase Order with unique numbering (PO-XXXX) and itemized costs copied directly from the winning bid.' },
      { title: 'Automated PDF Invoice Generation', desc: 'Procurement officers generate official invoices from Purchase Orders, calculate subtotal/tax/grand totals automatically, and download formatted PDF documents.' }
    ];

    coreFeatures.forEach(f => {
      if (doc.y > 710) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_DARK).lineGap(3);
      doc.text('•   ', 54, doc.y, { continued: true });
      doc.text(`${f.title} – `, { continued: true });
      doc.font('Helvetica').fillColor(TEXT_MUTED);
      doc.text(f.desc, { align: 'justify', width: doc.page.width - 124 });
      doc.moveDown(0.5);
    });

    doc.moveDown(0.6);
    if (doc.y > 670) doc.addPage();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SECONDARY_COLOR);
    doc.text('B. Advanced & AI-Enhanced Features Added', 54, doc.y);
    doc.moveDown(0.5);

    const advFeatures = [
      { title: 'AI-Powered Quotation Summarizer & Anomaly Detection', desc: 'Uses AI algorithms to analyze incoming vendor quotations, highlight pricing anomalies (e.g., unit prices significantly above historical average), and summarize key terms for officers.' },
      { title: 'Automated Vendor Scorecard & Performance Rating', desc: 'Automatically calculates a vendor reliability score (1 to 5 stars) based on historical quotation competitiveness, on-time delivery performance, and order fulfillment accuracy.' },
      { title: 'Budget & Spend Threshold Alerting', desc: 'Allows administrators to set monthly or category-based spending limits. When a PO exceeds the budget threshold, the system automatically triggers a high-priority warning requiring senior management sign-off.' },
      { title: 'Plagiarism & Bid Collusion Detection', desc: 'Automatically scans and flags vendor quotations that have identical line-item pricing structures or note formatting across multiple competing vendors, ensuring fair bidding.' },
      { title: 'Real-Time Notification & Alert Center', desc: 'Integrated in-app toast alerts and automated email notifications informing vendors of new RFQ invitations, status updates, and newly issued Purchase Orders/Invoices.' },
      { title: 'Excel / CSV Data Sync & Export', desc: 'One-click export functionality allowing procurement officers and accounting teams to export spending analytics, vendor directories, and quotation comparison sheets to Excel/CSV format.' },
      { title: 'Interactive Procurement Timeline & Audit Trail', desc: 'Visual, chronological timeline showing every step of an RFQ\'s lifecycle (Created → Published → Quoted → Selected → Approved → PO Issued → Invoiced → Paid).' },
      { title: 'Multi-Device Responsive Design with Dark Mode', desc: 'Fully responsive layout built with Tailwind CSS supporting mobile, tablet, and desktop viewing, complete with a toggleable sleek dark mode aesthetic.' }
    ];

    advFeatures.forEach(f => {
      if (doc.y > 710) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PRIMARY_COLOR).lineGap(3);
      doc.text('•   ', 54, doc.y, { continued: true });
      doc.text(`${f.title} – `, { continued: true });
      doc.font('Helvetica').fillColor(TEXT_DARK);
      doc.text(f.desc, { align: 'justify', width: doc.page.width - 124 });
      doc.moveDown(0.5);
    });
    doc.moveDown(0.8);

    // Section 5: TECHNOLOGY STACK
    drawSectionHeader('5', 'TECHNOLOGY STACK (MERN STACK — PLAIN JAVASCRIPT)');
    const techStack = [
      { title: 'React.js (JSX)', desc: 'Frontend framework used to build the single-page interactive user interface, dynamic dashboards, and role-based portals using clean, plain JavaScript (JSX) without complex TypeScript overhead.' },
      { title: 'Node.js & Express.js', desc: 'Backend runtime environment and fast web framework used to build RESTful APIs, handle procurement business logic, JWT authentication, and role-based authorization in plain .js files.' },
      { title: 'MongoDB & Mongoose ODM', desc: 'NoSQL document database and Object Data Modeling library used to store users, vendors, RFQs, embedded line items, quotations, approvals, purchase orders, invoices, and activity logs in flexible, high-performance JSON-like structures without requiring manual SQL table migrations.' },
      { title: 'Tailwind CSS & Lucide Icons', desc: 'Utility-first CSS framework used for rapid, modern styling, responsive layouts, glassmorphic cards, and consistent executive ERP visual design.' },
      { title: 'JSON Web Tokens (JWT) & Bcrypt.js', desc: 'Used for stateless, secure user authentication, role verification, and military-grade password hashing.' },
      { title: 'PDFKit & Nodemailer', desc: 'Backend libraries utilized for dynamically generating professional PDF procurement invoices/POs and sending automated email communications directly to vendors.' },
      { title: 'Recharts', desc: 'Rendering interactive, animated procurement charts (Area charts, Bar charts, Pie charts) on the analytics dashboard for spend tracking and trend analysis.' }
    ];

    techStack.forEach(t => {
      if (doc.y > 710) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_DARK).lineGap(3);
      doc.text('•   ', 54, doc.y, { continued: true });
      doc.text(`${t.title} – `, { continued: true });
      doc.font('Helvetica').fillColor(TEXT_MUTED);
      doc.text(t.desc, { align: 'justify', width: doc.page.width - 124 });
      doc.moveDown(0.5);
    });

    // Draw headers and footers across all pages
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      // Top Header
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_COLOR);
      doc.text('VendorBridge — Procurement ERP', 50, 35);
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MUTED);
      const rightText = 'MERN Stack Architecture & Project Specs v2.0';
      doc.text(rightText, doc.page.width - 50 - doc.widthOfString(rightText), 35);
      
      // Header Divider Line
      doc.moveTo(50, 48).lineTo(doc.page.width - 50, 48).lineWidth(1).strokeColor(LINE_COLOR).stroke();

      // Footer Divider Line
      doc.moveTo(50, doc.page.height - 45).lineTo(doc.page.width - 50, doc.page.height - 45).lineWidth(1).strokeColor(LINE_COLOR).stroke();

      // Footer Text
      doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED);
      doc.text('Confidential & Proprietary — VendorBridge Project Documentation', 50, doc.page.height - 35);
      const pageStr = `Page ${i + 1} of ${totalPages}`;
      doc.text(pageStr, doc.page.width - 50 - doc.widthOfString(pageStr), doc.page.height - 35);
    }

    doc.end();
    stream.on('finish', () => resolve(targetPath));
    stream.on('error', reject);
  });
}

async function run() {
  try {
    await generateDocument(projectRootOutput);
    console.log('✅ Generated PDF inside Project Root:', projectRootOutput);
  } catch (err) {
    console.error('Error generating in project root:', err);
  }
  try {
    await generateDocument(desktopOutput);
    console.log('✅ Generated PDF on Desktop:', desktopOutput);
  } catch (err) {
    console.error('Error generating on Desktop:', err);
  }
}

run();
