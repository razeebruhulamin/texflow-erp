import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toUpperCase();
  if (['ACTIVE', 'RECEIVED', 'PAID', 'COMPLETED', 'DELIVERED', 'APPROVED'].includes(normalized)) {
    return <Badge variant="success">{normalized.replace(/_/g, ' ')}</Badge>;
  }
  if (['PARTIAL', 'PARTIALLY_RECEIVED', 'IN_PROGRESS', 'PENDING', 'DISPATCHED', 'TRIAL'].includes(normalized)) {
    return <Badge variant="warning">{normalized.replace(/_/g, ' ')}</Badge>;
  }
  if (['DRAFT', 'WHOLESALE', 'RETAIL', 'STANDARD'].includes(normalized)) {
    return <Badge variant="neutral">{normalized.replace(/_/g, ' ')}</Badge>;
  }
  if (['CANCELLED', 'SUSPENDED', 'EXPIRED', 'UNPAID', 'REJECTED'].includes(normalized)) {
    return <Badge variant="danger">{normalized.replace(/_/g, ' ')}</Badge>;
  }
  return <Badge variant="info">{normalized.replace(/_/g, ' ')}</Badge>;
};
