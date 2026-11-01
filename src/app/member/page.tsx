'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { memberApi } from '@/lib/api/member/member.api';
import {
  Dumbbell,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  QrCode,
  LogOut,
  MapPin,
  Flame,
  Award,
  AlertCircle,
  ScanLine,
  RefreshCw,
  Camera,
  X,
} from 'lucide-react';
import { App, Modal } from 'antd';

export default function MemberPassPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const scannerRef = React.useRef<any>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await memberApi.getProfile();
      if (res.status && res.data) {
        setMemberData(res.data.member);
        setRecentVisits(res.data.recentVisits || []);
      } else {
        message.warning('Session expired. Please log in.');
        router.push('/member/login');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Please log in to view your pass');
      router.push('/member/login');
    } finally {
      setLoading(false);
    }
  }, [message, router]);

  useEffect(() => {
    const token = memberApi.getToken();
    if (!token) {
      router.push('/member/login');
      return;
    }
    fetchProfile();
  }, [fetchProfile, router]);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const isRunning = scannerRef.current.isScanning;
        if (isRunning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      // ignore cleanup error
    }
  }, []);

  const handleQrScanned = useCallback(async (decodedText: string) => {
    if (scanning) return;
    setScanning(true);
    setScannedSuccess(true);

    try {
      // Vibrate if supported on device for physical feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

      await stopScanner();

      const res = await memberApi.checkIn(decodedText);
      if (res.status) {
        message.success(res.message || 'QR Verified! Checked in successfully!');
        setIsScannerOpen(false);
        fetchProfile();
      } else {
        message.error(res.message || 'Check-in failed');
        setScannedSuccess(false);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Check-in failed. Please scan the official Gym Entrance QR poster.';
      message.error(errMsg);
      setScannedSuccess(false);
    } finally {
      setScanning(false);
    }
  }, [scanning, stopScanner, message, fetchProfile]);

  const startCameraScanner = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);
    setScannedSuccess(false);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Ensure previous instance is stopped
      await stopScanner();

      const scannerElement = document.getElementById('qr-camera-reader');
      if (!scannerElement) {
        setCameraLoading(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-camera-reader');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleQrScanned(decodedText);
        },
        () => {
          // Scanning frame callback (no QR in current frame)
        }
      );
    } catch (err: any) {
      console.error('Camera start error:', err);
      let msg = 'Unable to access camera. Please allow camera permissions in your browser.';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        msg = 'Camera permission denied. Please allow camera access in browser settings to scan.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  }, [stopScanner, handleQrScanned]);

  useEffect(() => {
    if (isScannerOpen) {
      // Small timeout to allow Modal DOM to mount
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isScannerOpen, startCameraScanner, stopScanner]);

  const handleCloseScanner = () => {
    stopScanner();
    setIsScannerOpen(false);
    setCameraError(null);
    setScannedSuccess(false);
  };

  const handleLogout = () => {
    memberApi.logout();
    message.info('Logged out from Member Pass');
    router.push('/member/login');
  };

  if (loading && !memberData) {
    return (
      <div className="min-h-screen bg-[#0E1512] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-400">Loading your Digital Pass...</p>
        </div>
      </div>
    );
  }

  const isExpiringSoon = memberData?.daysRemaining <= 7 && memberData?.daysRemaining > 0;
  const isExpired = memberData?.daysRemaining <= 0;

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-white font-sans pb-16 selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <nav className="bg-[#121A15]/80 border-b border-emerald-950 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Dumbbell className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">
              {memberData?.gymName || 'Gyment'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">
              Digital Member Pass
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProfile}
            title="Refresh"
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto p-4 sm:p-5 space-y-4">
        {/* Checked in Banner if already checked in today */}
        {memberData?.checkedInToday ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg shadow-emerald-950/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">Attendance Marked Today!</h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Have a great workout today at {memberData?.gymName}.
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-extrabold rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-stone-950/15 flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-stone-950 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-85 block">
                  Gym Entrance
                </span>
                <span className="text-base font-black">Scan Gym QR to Check In</span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-stone-950 text-emerald-400 text-xs font-bold">
              Tap to Scan
            </div>
          </button>
        )}

        {/* Digital Member Card */}
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-[#16241D] via-[#101A15] to-[#0A100D] border border-emerald-500/30 p-6 shadow-2xl">
          {/* Card background watermark */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Dumbbell className="w-48 h-48 -mr-10 -mt-10" />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                {memberData?.gymName}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {memberData?.name}
              </h2>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-md bg-stone-900/80 border border-stone-800 text-[11px] font-mono text-stone-300">
                <span>ID:</span>
                <span className="text-emerald-400 font-bold">{memberData?.memberCode}</span>
              </div>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-stone-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 uppercase">
              {memberData?.firstName?.[0] || 'M'}
            </div>
          </div>

          {/* Plan badge & Expiry */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Membership
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate">
                {memberData?.planName}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Expires On
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {memberData?.planExpiry}
              </span>
            </div>
          </div>

          {/* Expiry Pill Indicator */}
          <div className="relative z-10 mt-4 flex items-center justify-between text-xs">
            {isExpired ? (
              <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" /> Plan Expired
              </span>
            ) : isExpiringSoon ? (
              <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> {memberData?.daysRemaining} days remaining
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
              </span>
            )}

            {memberData?.balanceAmount > 0 && (
              <span className="text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900 text-[11px]">
                Due: ₹{memberData.balanceAmount}
              </span>
            )}
          </div>
        </div>


        {/* Activity & Streak Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141C18] border border-stone-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Total Visits</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">
              {memberData?.totalVisits || 0}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Lifetime workouts</p>
          </div>

          <div className="bg-[#141C18] border border-stone-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Current Status</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-black text-white mt-2 truncate">
              {memberData?.status}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Verified Profile</p>
          </div>
        </div>

        {/* Recent Attendance History */}
        <div className="bg-[#141C18] border border-stone-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Recent Check-ins
            </h4>
            <span className="text-[11px] text-stone-500 font-semibold">Last 10 Visits</span>
          </div>

          {recentVisits.length === 0 ? (
            <p className="text-xs text-stone-500 py-3 text-center">
              No recent check-ins recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentVisits.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/60 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{v.date}</span>
                      <span className="text-[10px] text-stone-400">{v.method}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-stone-300">{v.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Real HTML5 Camera QR Scanner Modal */}
      <Modal
        open={isScannerOpen}
        onCancel={handleCloseScanner}
        footer={null}
        centered
        width={380}
        destroyOnHidden
        closeIcon={<X className="w-5 h-5 text-white" />}
        styles={{
          body: {
            backgroundColor: '#121A15',
            borderRadius: '24px',
            padding: '24px',
            color: '#fff',
          },
        }}
      >
        <div className="text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/10">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Scan Gym Entrance QR</h3>
          <p className="text-xs text-stone-400 mt-1 mb-5">
            Point your camera at the Gyment poster located at the entrance door to mark today&apos;s attendance.
          </p>

          {/* Real Video / Camera Stream Box */}
          <div className="relative w-64 h-64 mx-auto bg-stone-950 rounded-2xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden mb-4 shadow-2xl">
            {/* HTML5 QR Camera Target Div */}
            <div
              id="qr-camera-reader"
              className="w-full h-full object-cover [&_video]:w-full! [&_video]:h-full! [&_video]:object-cover! [&_video]:rounded-2xl!"
            />

            {/* Camera Loading Spinner */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-[#0E1512]/90 flex flex-col items-center justify-center gap-2.5 z-20">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-stone-300 font-semibold">Starting camera...</span>
              </div>
            )}

            {/* Camera Permission / Device Error */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#0E1512]/95 p-4 flex flex-col items-center justify-center text-center gap-3 z-20">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-300 font-medium leading-relaxed">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer transition-colors"
                >
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* Scanned Success Glow Overlay */}
            {scannedSuccess && (
              <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-xs font-black text-white bg-stone-950/80 px-2.5 py-1 rounded-full">
                  QR Verified!
                </span>
              </div>
            )}

            {/* Dynamic Laser Scanning Guide Overlay */}
            {!cameraLoading && !cameraError && !scannedSuccess && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between p-4">
                <div className="w-full flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
                </div>

                <div className="w-full h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-bounce" />

                <div className="w-full flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-3 text-center">
            <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
              Scanning automatically marks attendance once aligned.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
