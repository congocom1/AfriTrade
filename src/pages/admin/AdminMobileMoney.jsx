import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import MobileMoneyLedger from '@/components/payments/MobileMoneyLedger';
import { ADMIN_LINKS } from '@/lib/navLinks';

/** Admin console view of the MainMoney payment ledger. */
export default function AdminMobileMoney() {
  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title="Paiements Mobile Money" links={ADMIN_LINKS} />
      <MobileMoneyLedger />
    </div>
  );
}