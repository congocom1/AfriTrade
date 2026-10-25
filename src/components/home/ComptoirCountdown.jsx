import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

function msToMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, end.getTime() - now.getTime());
}

// Deals run to the end of the day, so the band shows the real time left rather
// than a frozen figure.
export default function ComptoirCountdown() {
  const [left, setLeft] = useState(msToMidnight);

  useEffect(() => {
    const id = setInterval(() => setLeft(msToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.floor(left / 1000);
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');

  return (
    <span className="k-cd">
      <Timer aria-hidden="true" />
      {`${hours}:${minutes}:${seconds}`}
    </span>
  );
}