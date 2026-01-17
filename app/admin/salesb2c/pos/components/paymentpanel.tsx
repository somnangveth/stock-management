'use client';
import { CreditCard, Banknote, Building2, ArrowLeft } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type PaymentMethod = 'cash' | 'card' | 'bank-transfer';

interface PaymentPageProps {
  saleId: string;
  totalAmount: number;
  onBack: () => void;
}

export default function PaymentPage({
  saleId,
  totalAmount = 0,
  onBack,
}: PaymentPageProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Ensure totalAmount is a valid number
  const safeAmount = typeof totalAmount === 'number' && !isNaN(totalAmount) ? totalAmount : 0;

  const paymentMethods = [
    {
      type: 'cash' as PaymentMethod,
      label: 'Cash',
      icon: Banknote,
      color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
      activeColor: 'bg-amber-600 text-white',
    },
    {
      type: 'card' as PaymentMethod,
      label: 'Card',
      icon: CreditCard,
      color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
      activeColor: 'bg-amber-600 text-white',
    },
    {
      type: 'bank-transfer' as PaymentMethod,
      label: 'Bank Transfer',
      icon: Building2,
      color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
      activeColor: 'bg-amber-600 text-white',
    },
  ];

  const handlePaymentConfirm = () => {
    if (!selectedPayment) return;

    startTransition(async () => {
      try {
        // Here you would update the payment status in your database
        // const response = await updatePaymentStatus(saleId, selectedPayment);

        // Show success alert
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: `Payment of ${safeAmount.toFixed(2)} received via ${selectedPayment}`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Back to POS',
        });

        // Navigate back to main POS page
        router.push('/admin/salesb2c/pos');
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: 'An error occurred while processing payment',
          confirmButtonColor: '#ef4444',
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Receipt
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Payment</h1>
          <p className="text-gray-600 mt-2">Select payment method and confirm</p>
        </div>

        {/* Amount Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Amount Due</p>
            <p className="text-5xl font-bold text-gray-800">
              ${safeAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Select Payment Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.type;

              return (
                <button
                  key={method.type}
                  onClick={() => setSelectedPayment(method.type)}
                  className={`
                    flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all
                    ${isSelected ? method.activeColor : method.color}
                  `}
                >
                  <Icon className={`w-12 h-12 mb-3 ${isSelected ? 'text-white' : 'text-gray-700'}`} />
                  <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handlePaymentConfirm}
          disabled={!selectedPayment || isPending}
          className="w-full py-4 bg-green-600 text-white text-xl font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {isPending ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}