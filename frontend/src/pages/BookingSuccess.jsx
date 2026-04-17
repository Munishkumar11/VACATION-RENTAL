import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, ArrowRight, CalendarDays, House, Download } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(Boolean(bookingId));
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;

    axios
      .get(`/payment/invoice/${bookingId}`, { withCredentials: true })
      .then((res) => {
        if (isMounted) setInvoice(res.data.data);
      })
      .catch((error) => {
        if (isMounted) {
          setInvoiceError(error.response?.data?.message || "Invoice is not ready yet.");
        }
      })
      .finally(() => {
        if (isMounted) setInvoiceLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const downloadInvoice = async () => {
    if (!bookingId) return;

    try {
      setDownloadLoading(true);
      const res = await axios.get(`/payment/invoice/${bookingId}/download`, {
        withCredentials: true,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice?.invoiceNumber || `invoice-${bookingId}`}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setInvoiceError(error.response?.data?.message || "Unable to download invoice.");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#e0dbd0] rounded-[28px] shadow-sm overflow-hidden">
        <div className="bg-[#2f4f1f] text-white px-8 py-10">
          <div className="w-16 h-16 rounded-full bg-white/12 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <p className="text-sm uppercase tracking-[0.22em] text-white/70 mb-2">Booking Confirmed</p>
          <h1 className="text-3xl font-bold">Payment completed successfully</h1>
          <p className="text-white/80 mt-3 max-w-xl">
            Your Razorpay payment was verified and your booking is now confirmed.
          </p>
        </div>

        <div className="px-8 py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e0dbd0] bg-[#faf8f2] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9a9476] mb-2">
                Booking ID
              </p>
              <p className="text-base font-semibold text-[#2d3a1e] break-all">
                {bookingId || "Available in My Bookings"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e0dbd0] bg-[#faf8f2] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9a9476] mb-2">
                Invoice
              </p>
              {invoiceLoading ? (
                <p className="text-base font-semibold text-[#2d3a1e]">Preparing invoice...</p>
              ) : invoice ? (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#2d3a1e] break-all">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-sm text-[#7b745f]">
                    Paid {formatAmount(invoice.payment?.paidAmount)}
                  </p>
                </div>
              ) : (
                <p className="text-base font-semibold text-[#9a5a45]">
                  {invoiceError || "Invoice unavailable"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={downloadInvoice}
              disabled={!bookingId || !invoice || downloadLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f4f1f] hover:bg-[#243d18] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloadLoading ? "Downloading..." : "Download Invoice"}
            </button>

            <Link
              to="/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6b8c3e] hover:bg-[#5a7a30] text-white font-semibold px-5 py-3 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              View My Bookings
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8d3c8] text-[#2d3a1e] hover:bg-[#faf8f2] font-semibold px-5 py-3 transition-colors"
            >
              <House className="w-4 h-4" />
              Back To Home
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#ece6da]">
            <Link
              to="/messages"
              className="inline-flex items-center gap-2 text-[#6b8c3e] font-semibold hover:text-[#5a7a30]"
            >
              Contact host in messages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
