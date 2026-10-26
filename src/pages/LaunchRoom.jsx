import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, ShieldCheck, Smartphone, Globe } from 'lucide-react';
import LaunchAgentChat from '@/components/launch/LaunchAgentChat';
import LaunchTaskBoard from '@/components/launch/LaunchTaskBoard';

const AGENTS = [
  { key: 'qa', name: 'launch_qa_agent', Icon: ShieldCheck },
  { key: 'app', name: 'app_launch_agent', Icon: Smartphone },
  { key: 'web', name: 'web_launch_agent', Icon: Globe },
];

export default function LaunchRoom() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('qa');
  const active = AGENTS.find((agent) => agent.key === activeKey) || AGENTS[0];
  const suggestions = [1, 2].map((index) => t(`launch.suggest.${active.key}.${index}`));

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold md:text-xl">
          <Rocket className="h-5 w-5 text-primary" /> {t('launch.title')}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{t('launch.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {AGENTS.map(({ key, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              activeKey === key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(`launch.agents.${key}.name`)}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{t(`launch.agents.${active.key}.role`)}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <LaunchAgentChat
          key={active.name}
          agent={active.name}
          label={t(`launch.agents.${active.key}.name`)}
          description={t(`launch.agents.${active.key}.role`)}
          suggestions={suggestions}
        />
        <LaunchTaskBoard />
      </div>
    </div>
  );
}