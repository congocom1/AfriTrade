import React from 'react';
import BackofficeNav from '@/components/backoffice/BackofficeNav';
import MobileMoneyLedger from '@/components/payments/MobileMoneyLedger';

/** Back-office view: every MainMoney transaction with its live payment status. */
export default function MobileMoneyTransactions() {
  return <div className="min-h-screen bg-background font-body text-foreground md:flex">
    <BackofficeNav />
    <main className="min-w-0 flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Espace réservé · finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Transactions Mobile Money</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suivi en direct des encaissements MainMoney.</p>
        </header>
        <MobileMoneyLedger />
      </div>
    </main>
  </div>;
}