import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// Register custom fonts for Rupee symbol support
try {
  const regularFont = fs.readFileSync(path.join(process.cwd(), "public", "pdf-assets", "Roboto-Regular.ttf"));
  const boldFont = fs.readFileSync(path.join(process.cwd(), "public", "pdf-assets", "Roboto-Bold.ttf"));

  Font.register({
    family: "Roboto",
    src: `data:font/truetype;charset=utf-8;base64,${regularFont.toString("base64")}`,
  });
  Font.register({
    family: "Roboto-Bold",
    src: `data:font/truetype;charset=utf-8;base64,${boldFont.toString("base64")}`,
  });
} catch (e) {
  console.warn("Could not register Roboto font.", e);
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#111827",
    padding: 48,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  agencyLogo: {
    width: 140, // Keeps aspect ratio by driving width
    marginBottom: 4,
  },
  agencyTagline: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 2,
  },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Roboto-Bold",
    color: "#4f46e5",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 2,
  },
  // Meta section
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Roboto-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 9,
    color: "#111827",
    lineHeight: 1.5,
  },
  metaValueBold: {
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Roboto-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colNo: { width: "10%" },
  colWork: { width: "30%" },
  colDesc: { width: "42%" },
  colPrice: { width: "18%", textAlign: "right" },
  cellText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  cellBold: {
    fontSize: 9,
    fontFamily: "Roboto-Bold",
    color: "#111827",
  },
  // Total
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 32,
  },
  totalBox: {
    width: "40%",
    borderTopWidth: 2,
    borderTopColor: "#4f46e5",
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 9,
    color: "#111827",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Roboto-Bold",
    color: "#111827",
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Roboto-Bold",
    color: "#4f46e5",
  },
  // Paid watermark
  paidBadge: {
    position: "absolute",
    top: 140,
    right: 48,
    borderWidth: 3,
    borderColor: "#16a34a",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    transform: "rotate(-15deg)",
  },
  paidBadgeText: {
    fontSize: 22,
    fontFamily: "Roboto-Bold",
    color: "#16a34a",
    letterSpacing: 3,
    opacity: 0.6,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  thankYou: {
    fontSize: 8,
    color: "#6b7280",
  },
});

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface WorkEntry {
  id: number;
  date: string;
  kind_of_work: string;
  description: string | null;
  price: number;
}

interface InvoiceDocumentProps {
  invoice: {
    id: number;
    invoice_number: string;
    issue_date: string;
    total_amount: number;
    status: string;
    client_name: string;
    client_email: string | null;
    client_phone: string | null;
    client_address: string | null;
    paid_at: string | null;
  };
  entries: WorkEntry[];
}

export function InvoiceDocument({
  invoice,
  entries,
}: InvoiceDocumentProps) {
  const isPaid = invoice.status === "paid";

  // Read image as buffer to avoid 'fetch failed' on Windows absolute paths
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
  } catch (e) {
    console.warn("Could not load logo.png", e);
  }

  return (
    <Document
      title={`Invoice ${invoice.invoice_number}`}
      author="Watermelon Branding"
    >
      <Page size="A4" style={styles.page}>
        {/* Paid watermark */}
        {isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoBuffer && (
              <Image 
                src={{ data: logoBuffer, format: "png" }} 
                style={styles.agencyLogo} 
              />
            )}
            <Text style={styles.agencyTagline}>www.watermelonbranding.in</Text>
            <Text style={styles.agencyTagline}>hello@watermelonbranding.in</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaSection}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Billed To</Text>
            <Text style={styles.metaValueBold}>{invoice.client_name}</Text>
            {invoice.client_email && (
              <Text style={styles.metaValue}>{invoice.client_email}</Text>
            )}
            {invoice.client_phone && (
              <Text style={styles.metaValue}>{invoice.client_phone}</Text>
            )}
            {invoice.client_address && (
              <Text style={styles.metaValue}>{invoice.client_address}</Text>
            )}
          </View>
          <View style={[styles.metaBlock, { alignItems: "flex-end" }]}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            {isPaid && invoice.paid_at && (
              <View>
                <Text style={styles.metaLabel}>Paid On</Text>
                <Text style={[styles.metaValue, { color: "#16a34a" }]}>
                  {formatDate(invoice.paid_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colWork]}>Work</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Amount</Text>
          </View>
          {entries.map((entry, i) => (
            <View
              key={entry.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.cellText, styles.colNo]}>
                {i + 1}
              </Text>
              <Text style={[styles.cellBold, styles.colWork]}>
                {entry.kind_of_work}
              </Text>
              <Text style={[styles.cellText, styles.colDesc]}>
                {entry.description ?? "—"}
              </Text>
              <Text style={[styles.cellBold, styles.colPrice]}>
                {formatCurrency(entry.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal ({entries.length} items)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total_amount)}</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb" }]}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Watermelon Branding · {invoice.invoice_number}</Text>
          <Text style={styles.thankYou}>Thank you for your business.</Text>
        </View>
      </Page>
    </Document>
  );
}
