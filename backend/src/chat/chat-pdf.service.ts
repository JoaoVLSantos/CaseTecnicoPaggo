import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib'

@Injectable()
export class ChatPdfService {
  constructor(private prisma: PrismaService) {}

  private splitTextIntoLines(
    font: PDFFont,
    text: string,
    fontSize: number,
    maxWidth: number,
  ): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  async generateChatPdf(chatId: string, userId: string): Promise<Uint8Array> {
    // 1. Busca o chat com todas as interações
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        interactions: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!chat) {
      throw new NotFoundException('Chat não encontrado')
    }

    // 2. Cria o PDF
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontSize = 12
    const margin = 50
    const pageWidth = pdf.addPage().getWidth()
    pdf.removePage(0) // removemos a página criada apenas para pegar largura

    // 3. Página de Texto Extraído
    let page = pdf.addPage()
    let cursorY = page.getHeight() - margin

    page.drawText('Texto Extraído:', {
      x: margin,
      y: cursorY,
      size: fontSize + 2,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= fontSize + 6

    for (const block of chat.extractedText.split('\n')) {
      const wrapped = this.splitTextIntoLines(
        font,
        block,
        fontSize,
        pageWidth - margin * 2,
      )
      for (const line of wrapped) {
        if (cursorY < margin) {
          page = pdf.addPage()
          cursorY = page.getHeight() - margin
        }
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        cursorY -= fontSize + 4
      }
      cursorY -= fontSize
    }

    // 4. Página de Interações
    page = pdf.addPage()
    cursorY = page.getHeight() - margin

    page.drawText('Interações (Perguntas e Respostas):', {
      x: margin,
      y: cursorY,
      size: fontSize + 2,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= fontSize + 10

    for (const intr of chat.interactions) {
      // Pergunta
      const qLines = this.splitTextIntoLines(
        font,
        `Pergunta: ${intr.question}`,
        fontSize,
        pageWidth - margin * 2,
      )
      for (const line of qLines) {
        if (cursorY < margin) {
          page = pdf.addPage()
          cursorY = page.getHeight() - margin
        }
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        cursorY -= fontSize + 4
      }
      cursorY -= fontSize

      // Resposta
      const aLines = this.splitTextIntoLines(
        font,
        `Resposta: ${intr.answer}`,
        fontSize,
        pageWidth - margin * 2,
      )
      for (const line of aLines) {
        if (cursorY < margin) {
          page = pdf.addPage()
          cursorY = page.getHeight() - margin
        }
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        cursorY -= fontSize + 4
      }
      cursorY -= fontSize * 2
    }

    // 5. Retorna bytes do PDF
    return pdf.save()
  }
}
