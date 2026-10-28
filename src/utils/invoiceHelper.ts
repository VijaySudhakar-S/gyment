export async function generateUniqueInvoiceNumber(txOrDb: any): Promise<string> {
  const latestPayment = await txOrDb.payment.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (latestPayment?.invoiceNumber) {
    const match = latestPayment.invoiceNumber.match(/INV-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  // Ensure collision safety in case of non-sequential or parallel generation
  while (true) {
    const candidate = `INV-${String(nextNum).padStart(5, '0')}`;
    const exists = await txOrDb.payment.findUnique({
      where: { invoiceNumber: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
    nextNum += 1;
  }
}
