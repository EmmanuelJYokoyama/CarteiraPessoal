import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer'; // Importa Buffer explicitamente
import { getAllTransactionsByUserId } from '../transactions/transactions.service';

type ChartPayload = { name: string; base64: string };

export async function reportsRoutes(app: FastifyInstance) {
  app.post('/reports/export/pdf', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
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

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Title
        doc.fontSize(20).text('Relatório de Transações', { align: 'center' });
        doc.moveDown(0.5);
      // Tenta usar o nome do usuário vindo do token, com fallback para o ID
      doc.fontSize(10).text(`Usuário: ${user.name || user.userId}`);
        const periodText = `${startDate ? startDate.toLocaleDateString() : '—'} → ${endDate ? endDate.toLocaleDateString() : '—'}`;
        doc.text(`Período: ${periodText}`);
      doc.moveDown(1);

      // Transactions table (Agora logo após o cabeçalho)
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
        // Verifica se precisa de nova página para a tabela
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

      // Atualiza a posição y após a tabela para os gráficos, se houver
      doc.y = y + 20;

        // Charts section
        if (charts.length > 0) {
        // Adiciona uma nova página apenas para os gráficos se a tabela ocupou muito espaço
        if (doc.y > doc.page.height - 300) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }
        
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

        doc.end();
      });

      return reply
        .type('application/pdf')
        .header('Content-Disposition', 'attachment; filename="transactions-report.pdf"')
        .send(pdfBuffer);
    } catch (error) {
      console.error('[Reports] Error generating PDF:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}

export default reportsRoutes;
