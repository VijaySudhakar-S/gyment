import React from 'react';
import { getStatusBadgeClasses, getPaymentBadgeClasses } from '@/utils/gymAdminHelpers';
import { GymMemberStatus, GymMemberPaymentStatus } from '@/types/gymAdmin';

interface GymStatusBadgeProps {
 status: GymMemberStatus | GymMemberPaymentStatus | string;
 type?: 'membership' | 'payment';
 className?: string;
}

export const GymStatusBadge: React.FC<GymStatusBadgeProps> = ({
 status,
 type = 'membership',
 className = '',
}) => {
 const meta =
 type === 'payment'
 ? getPaymentBadgeClasses(status as GymMemberPaymentStatus)
 : getStatusBadgeClasses(status as GymMemberStatus);

 return (
 <span
 className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors ${meta.bg} ${meta.text} ${className}`}
 >
 <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
 {meta.label}
 </span>
 );
};
