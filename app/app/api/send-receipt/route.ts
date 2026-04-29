import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // We'll generate PDF next step
    const pdfBuffer = Buffer.from('PDF_PLACEHOLDER')

    await resend.emails.send({
      from: 'invoice@yourdomain.com',
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
          content: pdfBuffer
        }
      ]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
