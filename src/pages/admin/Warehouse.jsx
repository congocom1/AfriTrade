import React, { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import PickPackQueue from '@/components/warehouse/PickPackQueue';
import ReceivingPanel from '@/components/warehouse/ReceivingPanel';
import OriginReceivingPanel from '@/components/warehouse/OriginReceivingPanel';
import IntlPackingPanel from '@/components/warehouse/IntlPackingPanel';
import ChinaWarehousePanel from '@/components/warehouse/ChinaWarehousePanel';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ADMIN_LINKS } from '@/lib/navLinks';

export default function Warehouse() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('pick');
  const tabs = [['pick', t('warehouse.pick')], ['receive', t('warehouse.receive')], ['intl', t('originReceiving.tab')], ['pack', t('intlPacking.tab')], ['china', 'Chine']];
  return (
    <div className="portal-page space-y-6 pb-8">
      <DashboardNav title={t('warehouse.title')} links={ADMIN_LINKS} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label={t('warehouse.title')} className="flex w-full justify-start">
          {tabs.map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="pick"><PickPackQueue /></TabsContent>
        <TabsContent value="receive"><ReceivingPanel /></TabsContent>
        <TabsContent value="intl"><OriginReceivingPanel /></TabsContent>
        <TabsContent value="pack"><IntlPackingPanel /></TabsContent>
        <TabsContent value="china"><ChinaWarehousePanel /></TabsContent>
      </Tabs>
    </div>
  );
}