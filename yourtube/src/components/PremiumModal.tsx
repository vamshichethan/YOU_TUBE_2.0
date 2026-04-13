import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "Bronze" | "Silver" | "Gold";
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, defaultPlan }) => {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<"Bronze" | "Silver" | "Gold">(defaultPlan || "Silver");
  const [isProcessing, setIsProcessing] = useState(false);
  const currentPlan = user?.plan || "Free";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!user?._id) {
      alert("Please sign in before upgrading your plan.");
      return;
    }

    try {
      setIsProcessing(true);
      const orderRes = await axiosInstance.post("/payment/create-order", { plan: selectedPlan });
      const order = orderRes.data;
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockKeyId123";

      if (order.mockMode || razorpayKey.includes("mock")) {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const encoder = new TextEncoder();
        const signaturePayload = `${order.id}|${mockPaymentId}`;
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode("mockSecretKey456"),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signaturePayload));
        const mockSignature = Array.from(new Uint8Array(signatureBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");

        const verifyRes = await axiosInstance.post("/payment/verify", {
          razorpay_order_id: order.id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
          userId: user?._id,
          plan: selectedPlan
        });

        if (verifyRes.data.plan === selectedPlan) {
          const invoiceId = verifyRes.data.invoice?.invoiceId;
          alert(`Test payment successful! You are now on the ${selectedPlan} Plan. Invoice ${invoiceId || ""} has been emailed to ${user?.email}.`);
          onClose();
          window.location.reload();
        }
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "YourTube Premium",
        description: `Upgrade to ${selectedPlan} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user?._id,
              plan: selectedPlan
            });
            if (verifyRes.data.plan === selectedPlan) {
              const invoiceId = verifyRes.data.invoice?.invoiceId;
              alert(`Payment successful! You are now on the ${selectedPlan} Plan. Invoice ${invoiceId || ""} has been emailed to ${user?.email}.`);
              onClose();
              window.location.reload();
            }
          } catch (err) {
            alert("Payment verification failed.");
          } finally {
             setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "Test User",
          email: user?.email || "test@example.com",
        },
        theme: {
          color: selectedPlan === 'Gold' ? '#EAB308' : selectedPlan === 'Silver' ? '#94A3B8' : '#D97706',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment Failed. Reason: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to initialize payment.");
      setIsProcessing(false);
    }
  };

  const plans = [
     { name: "Bronze", price: 10, limit: "Watch up to 7 minutes per video", color: "bg-amber-600" },
     { name: "Silver", price: 50, limit: "Watch up to 10 minutes per video", color: "bg-slate-500" },
     { name: "Gold", price: 100, limit: "Unlimited video watching time", color: "bg-yellow-500" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition text-xl font-bold"
        >
          ✕
        </button>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h2>
          <p className="text-gray-600 mb-6">
            Free users can watch up to 5 minutes per video. Upgrade through Razorpay test mode to unlock longer viewing limits and premium access.
          </p>
          <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
            Current plan: <span className="font-bold text-black">{currentPlan}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div 
                key={p.name}
                onClick={() => setSelectedPlan(p.name as any)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedPlan === p.name ? `border-black ring-2 ring-black/10 scale-105 shadow-md` : `border-gray-200 hover:border-gray-300 bg-gray-50`}`}
              >
                 <div className={`w-8 h-8 rounded-full mb-3 mx-auto ${p.color}`}></div>
                 <h3 className="font-bold text-xl">{p.name}</h3>
                 <div className="text-2xl font-black my-2">₹{p.price}</div>
                 <p className="text-sm text-gray-600 min-h-[40px]">{p.limit}</p>
                 <div className="mt-4 w-full text-xs font-semibold py-1.5 rounded-full border border-gray-300">
                    {currentPlan === p.name ? "Current Plan" : selectedPlan === p.name ? "Selected" : "Select"}
                 </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={isProcessing || currentPlan === selectedPlan}
            className={`w-full mt-8 font-semibold py-6 text-lg rounded-xl shadow-lg transition-transform hover:scale-[1.02] text-white ${selectedPlan === 'Gold' ? 'bg-yellow-500 hover:bg-yellow-600' : selectedPlan === 'Silver' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {isProcessing ? "Processing..." : currentPlan === selectedPlan ? `${selectedPlan} is Active` : `Upgrade to ${selectedPlan} (₹${plans.find(p => p.name === selectedPlan)?.price})`}
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Payments run through Razorpay test mode here. Successful upgrades update your plan instantly and trigger an invoice email with your plan details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
