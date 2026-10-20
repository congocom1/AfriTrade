import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Package, Truck, CreditCard, Store } from 'lucide-react';
import './commerce-intro.css';

const journeys = [
  { key: 'customers', to: '/search', icon: Store },
  { key: 'merchants', to: '/seller', icon: Package },
  { key: 'logistics', to: '/shipping-calculator', icon: Truck },
  { key: 'payments', to: '/wallet', icon: CreditCard },
];
const steps = ['request', 'source', 'consolidate', 'track', 'deliver'];

export default function CommerceIntro() {
  const { t } = useTranslation();
  return (
    <div className="commerce-intro">
      <section className="commerce-intro__hero" aria-labelledby="commerce-title">
        <p className="commerce-intro__eyebrow">{t('commerceIntro.eyebrow')}</p>
        <h1 id="commerce-title">{t('commerceIntro.title')}</h1>
        <p className="commerce-intro__description">{t('commerceIntro.description')}</p>
        <div className="commerce-intro__actions">
          <Link className="commerce-intro__primary" to="/search">{t('commerceIntro.start')}<ArrowRight size={16} aria-hidden="true" /></Link>
          <a className="commerce-intro__secondary" href="#trade-workspace">{t('commerceIntro.explore')}<ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="commerce-intro__workspace" id="trade-workspace" aria-labelledby="workspace-title">
        <h2 id="workspace-title">{t('commerceIntro.workspace')}</h2>
        <div className="commerce-intro__tools">
          {['orders', 'freight', 'finance'].map((key) => (
            <Link key={key} to={{ orders: '/order-history', freight: '/shipping-calculator', finance: '/wallet' }[key]}>
              <span>{t(`commerceIntro.${key}`)}</span>
              <small>{t(`commerceIntro.${key}Description`)}</small>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="journeys-title">
        <p className="commerce-intro__eyebrow">{t('commerceIntro.platform')}</p>
        <h2 id="journeys-title">{t('commerceIntro.journeys')}</h2>
        <div className="commerce-intro__journeys">
          {journeys.map(({ key, to, icon: Icon }) => (
            <Link key={key} to={to}>
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              <h3>{t(`commerceIntro.${key}`)}</h3>
              <p>{t(`commerceIntro.${key}Description`)}</p>
              <span>{t('commerceIntro.open')}<ArrowRight size={15} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-title">
        <p className="commerce-intro__eyebrow">{t('commerceIntro.connected')}</p>
        <h2 id="steps-title">{t('commerceIntro.steps')}</h2>
        <ol className="commerce-intro__steps">
          {steps.map((key, index) => (
            <li key={key}><span className="commerce-intro__number">0{index + 1}</span><h3>{t(`commerceIntro.${key}`)}</h3><p>{t(`commerceIntro.${key}Description`)}</p></li>
          ))}
        </ol>
      </section>

      <section className="commerce-intro__closing" aria-labelledby="commerce-closing-title">
        <div><p className="commerce-intro__eyebrow">AfriTrade</p><h2 id="commerce-closing-title">{t('commerceIntro.closing')}</h2><p>{t('commerceIntro.closingDescription')}</p></div>
        <Link to="/seller-application">{t('commerceIntro.sell')}<ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
