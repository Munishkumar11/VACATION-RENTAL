import { AlertCircle, ArrowLeft, House, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function BookingFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="min-h-screen bg-[#f5f3ee] px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#e0dbd0] rounded-[28px] shadow-sm overflow-hidden">
        <div className="bg-[#7c2d12] text-white px-8 py-10">
          <div className="w-16 h-16 rounded-full bg-white/12 flex items-center justify-center mb-5">
            <AlertCircle className="w-9 h-9" />
          </div>
          <p className="text-sm uppercase tracking-[0.22em] text-white/70 mb-2">Payment Failed</p>
          <h1 className="text-3xl font-bold">We could not confirm this payment</h1>
          <p className="text-white/80 mt-3 max-w-xl">
            The Razorpay checkout did not complete or the payment verification failed.
          </p>
        </div>

        <div className="px-8 py-8">
          <div className="rounded-2xl border border-[#e0dbd0] bg-[#faf8f2] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a9476] mb-2">
              Booking Reference
            </p>
            <p className="text-base font-semibold text-[#2d3a1e] break-all">
              {bookingId || "Not available"}
            </p>
          </div>

          <div className="mt-6 space-y-2 text-sm text-[#6b6754]">
            <p>Check that your Razorpay keys are configured in the backend.</p>
            <p>If money was deducted, verify the payment in your Razorpay dashboard before retrying.</p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6b8c3e] hover:bg-[#5a7a30] text-white font-semibold px-5 py-3 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              to="/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8d3c8] text-[#2d3a1e] hover:bg-[#faf8f2] font-semibold px-5 py-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              My Bookings
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8d3c8] text-[#2d3a1e] hover:bg-[#faf8f2] font-semibold px-5 py-3 transition-colors"
            >
              <House className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
