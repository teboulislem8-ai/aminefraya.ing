import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer
} from '@react-pdf/renderer'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    marginBottom: 5
  },
  section: {
    marginBottom: 10
  },
  table: {
    width: '100%',
    marginTop: 10
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    padding: 5
  },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14
  }
})

function InvoicePDF({
  clientName,
  items,
  total,
  invoiceNumber,
  date
}: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE</Text>
          <Text>Invoice #: {invoiceNumber}</Text>
          <Text>Date: {date}</Text>
        </View>

        <View style={styles.section}>
          <Text>Client: {clientName}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.col1}>Produit</Text>
            <Text style={styles.col2}>Qté</Text>
            <Text style={styles.col3}>Prix</Text>
            <Text style={styles.col4}>Total</Text>
          </View>

          {items.map((item: any, i: number) => (
            <View style={styles.row} key={i}>
              <Text style={styles.col1}>{item.name}</Text>
              <Text style={styles.col2}>{item.qty}</Text>
              <Text style={styles.col3}>{item.price}</Text>
              <Text style={styles.col4}>
                {item.qty * item.price}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.total}>
          TOTAL: {total} DA
        </Text>
      </Page>
    </Document>
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      clientName,
      email,
      items,
      total,
      invoiceNumber,
      date
    } = body

    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        clientName={clientName}
        items={items}
        total={total}
        invoiceNumber={invoiceNumber}
        date={date}
      />
    )

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Facture ${invoiceNumber}`,
      html: `
        <h2>Facture</h2>
        <p>Bonjour ${clientName}</p>
        <p>Veuillez trouver votre facture en pièce jointe.</p>
      `,
      attachments: [
  {
    filename: `facture-${invoiceNumber}.pdf`,
    content: pdfBuffer.toString('base64')
  }
]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to send receipt' },
      { status: 500 }
    )
  }
}
