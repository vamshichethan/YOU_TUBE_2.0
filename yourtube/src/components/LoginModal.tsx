import React, { useState } from 'react';
import { Button } from './ui/button';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import { GeoInfo } from '@/lib/useGeoTimeTheme';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  geo: GeoInfo;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, geo }) => {
  const { login } = useUser();
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isSouthIndia = geo.isSouthIndia;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/user/request-otp', {
        identifier,
        region: geo.region
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/user/verify-otp', {
        identifier,
        otp,
        name: identifier.split('@')[0], // Mock name
        image: "https://github.com/shadcn.png"
      });
      login(res.data.result);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 bg-background text-foreground border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-xl"
        >
          ✕
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sign in to YourTube</h2>
          <p className="text-sm opacity-70">
            Detected Region: <span className="font-semibold">{geo.region}</span>
          </p>
          <p className="text-xs mt-1 opacity-50 italic">
            {isSouthIndia ? "Regional Auth: Email Required" : "Regional Auth: Mobile Required"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80">
                {isSouthIndia ? "Email Address" : "Mobile Number"}
              </label>
              <input
                type={isSouthIndia ? "email" : "tel"}
                required
                className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-red-500 bg-background text-foreground transition-all placeholder:opacity-40"
                placeholder={isSouthIndia ? "example@email.com" : "+91 00000 00000"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg"
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-border outline-none focus:ring-2 focus:ring-red-500 bg-muted/30 text-foreground transition-all"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-xs mt-3 opacity-50 text-center">
                OTP has been sent to your registered {isSouthIndia ? "email" : "mobile"}.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </Button>
            <button
              type="button"
              onClick={() => setStep('input')}
              className="w-full text-sm opacity-60 hover:opacity-100 transition"
            >
              Change {isSouthIndia ? "Email" : "Phone"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
