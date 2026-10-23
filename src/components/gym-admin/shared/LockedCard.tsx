import React from 'react';
import { Lock } from 'lucide-react';
import { useGymAdmin } from '@/context/GymAdminContext';

interface LockedCardProps {
 title: string;
 planRequired: 'Growth' | 'Pro';
 description: string;
}

export const LockedCard: React.FC<LockedCardProps> = ({
 title,
 planRequired,
 description,
}) => {
 const { openCompareModal } = useGymAdmin();

 return (
 <div className="border border-dashed border-border rounded-2xl p-8 text-center bg-white shadow-xs flex flex-col items-center justify-center my-2">
 <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center mb-3.5 text-stone-500">
 <Lock className="w-5 h-5 stroke-2" />
 </div>
 <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full mb-3">
 Available in {planRequired} Plan
 </span>
 <h3 className="text-base font-bold text-gyment-text mb-1.5">
 {title}
 </h3>
 <p className="text-xs text-muted max-w-md mx-auto mb-5 leading-relaxed">
 {description}
 </p>
 <button
 type="button"
 onClick={openCompareModal}
 className="bg-primary hover:bg-primary-dark text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
 >
 View {planRequired} Plan
 </button>
 </div>
 );
};

export const LockedInline: React.FC<{
 title: string;
 planRequired: 'Growth' | 'Pro';
 description?: string;
}> = ({ title, planRequired, description }) => {
 const { openCompareModal } = useGymAdmin();

 return (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-dashed border-border rounded-xl p-3.5 sm:p-4 bg-stone-50/70 my-2">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-amber-100/60 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
 <Lock className="w-4 h-4 stroke-2" />
 </div>
 <div>
 <div className="text-sm font-bold text-gyment-text">{title}</div>
 <div className="text-xs text-muted">
 {description || `Available in ${planRequired} plan`}
 </div>
 </div>
 </div>
 <button
 type="button"
 onClick={openCompareModal}
 className="border border-border bg-white hover:bg-stone-50 text-gyment-text text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
 >
 View Plans
 </button>
 </div>
 );
};
