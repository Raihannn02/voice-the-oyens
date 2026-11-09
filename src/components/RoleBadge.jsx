import React from 'react';

const SIZES = {
  xs: 'text-[9px] px-1.5 py-[1px] gap-0.5',
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

// Badge kecil berwarna yang menampilkan role seorang anggota.
export default function RoleBadge({ role, size = 'xs', showName = true, className = '' }) {
  if (!role) return null;
  const color = role.color || '#949ba4';

  return (
    <span
      title={role.name}
      className={`inline-flex items-center rounded-full font-bold border align-middle ${SIZES[size] || SIZES.xs} ${className}`}
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}1f`,
      }}
    >
      {role.emoji ? <span className="leading-none">{role.emoji}</span> : null}
      {showName ? <span className="truncate max-w-[90px]">{role.name}</span> : null}
    </span>
  );
}
