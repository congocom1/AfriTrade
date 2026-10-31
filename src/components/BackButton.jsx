import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { ButtonWithSpring } from './ButtonWithSpring';

const BackButton = ({
  fallback = '/',
  className = '',
  variant = 'ghost',
  children,
  ...props
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // React Router navigation provides a reliable same-app history index.
    // A direct visit or external referrer always uses the safe fallback.
    const index = window.history.state?.idx;
    if (typeof index === 'number' && index > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: location.pathname === fallback });
    }
  };

  const baseStyles = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const variantStyles = {
    ghost: 'text-foreground hover:bg-secondary',
    outline: 'border border-border bg-background hover:bg-secondary',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  };

  return (
    <ButtonWithSpring
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={t('common.back')}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true"/>
      {children || t('common.back')}
    </ButtonWithSpring>
  );
};

export default BackButton;