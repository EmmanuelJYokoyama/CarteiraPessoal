import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import PDFDocument from 'pdfkit';
import { getAllTransactionsByUserId } from '../transactions/transactions.service';

type ChartPayload = { name: string; base64: string };

export async function reportsRoutes(app: FastifyInstance) {
  app.post('/reports/export/pdf', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = req.user as any;

    const body = req.body as any || {};
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const charts: ChartPayload[] = Array.isArray(body.charts) ? body.charts : [];

    const allTransactions = await getAllTransactionsByUserId(user.userId);
    const filtered = allTransactions.filter((tx: any) => {
      const d = new Date(tx.transactionDate);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers for streaming PDF
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="transactions-report.pdf"`);

    // Pipe PDF stream directly to response
    const stream = doc.pipe(reply.raw);

    // Title
    doc.fontSize(20).text('Relatório de Transações', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Usuário: ${user.userId}`);
    const periodText = `${startDate ? startDate.toLocaleDateString() : '—'} → ${endDate ? endDate.toLocaleDateString() : '—'}`;
    doc.text(`Período: ${periodText}`);
    doc.moveDown(0.5);

    // Charts section
    if (charts.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Gráficos', { align: 'left' });
      doc.moveDown(0.5);

      for (const chart of charts) {
        try {
          const raw = chart.base64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          const img = Buffer.from(raw, 'base64');
          doc.image(img, { fit: [500, 300], align: 'center' });
          doc.moveDown(0.5);
          doc.fontSize(12).text(chart.name || '', { align: 'center' });
          doc.moveDown(0.5);
        } catch (err) {
          console.error('[Reports] Failed to embed chart image', err);
          doc.fontSize(10).text(`(Não foi possível inserir o gráfico ${chart.name})`);
        }
      }
    }

    // Transactions table
    doc.addPage();
    doc.fontSize(16).text('Transações', { align: 'left' });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemHeight = 18;

    // Table header
    doc.fontSize(10).text('Data', 50, tableTop);
    doc.text('Descrição', 120, tableTop);
    doc.text('Categoria', 320, tableTop);
    doc.text('Valor (BRL)', 420, tableTop, { width: 80, align: 'right' });
    doc.text('Orig.', 510, tableTop, { width: 60, align: 'right' });

    let y = tableTop + 20;

    for (const tx of filtered) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }

      const dateText = new Date(tx.transactionDate).toLocaleDateString();
      doc.fontSize(9).text(dateText, 50, y);
      doc.text(tx.description || '', 120, y, { width: 180 });
      doc.text(tx.category || '-', 320, y);
      doc.text(Number(tx.amount).toFixed(2), 420, y, { width: 80, align: 'right' });
      const origText = tx.originalAmount ? `${Number(tx.originalAmount).toFixed(2)} ${tx.currency || 'BRL'}` : '-';
      doc.text(origText, 510, y, { width: 60, align: 'right' });
      y += itemHeight;
    }

    doc.end();

    // Return the stream (Fastify will handle closing)
    return stream;
  });
}

export default reportsRoutes;
