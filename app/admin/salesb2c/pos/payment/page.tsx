'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import PaymentPage from '../components/paymentpanel';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const saleId = searchParams.get('saleId');
  const amountParam = searchParams.get('amount');

  const totalAmount = amountParam ? parseFloat(amountParam) : 0;

  if (!saleId || Number.isNaN(totalAmount)) {
    return (
      <div className="p-10 text-red-600">
        Invalid payment data
      </div>
    );
  }

  return (
    <PaymentPage
      saleId={saleId}
      totalAmount={totalAmount}
      onBack={() => router.back()}
    />
  );
}

export default function PaymentRoute() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
