import { Link } from 'react-router-dom';

// Simple navigation component that renders a grid of links to all primary entry points.
// It pulls the list of routes from the application and displays them.
// The list is kept up-to-date with the routes defined in App.jsx.
const routes = [
  { path: '/', label: 'Home' },
  { path: '/discover', label: 'Discover' },
  { path: '/categories', label: 'Categories' },
  { path: '/search', label: 'Search' },
  { path: '/product', label: 'Product Detail' },
  { path: '/store', label: 'Store' },
  { path: '/cart', label: 'Cart' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/order', label: 'Order Confirmation' },
  { path: '/track', label: 'Track' },
  { path: '/wishlist', label: 'Wishlist' },
  { path: '/profile', label: 'Profile' },
  { path: '/wallet', label: 'Wallet' },
  { path: '/coupons', label: 'Coupons' },
  { path: '/referral', label: 'Referral' },
  { path: '/returns', label: 'Returns' },
  { path: '/vendor-onboarding', label: 'Seller Application' },
  { path: '/customer-loyalty', label: 'Customer Loyalty' },
  { path: '/vendor-ratings', label: 'Vendor Ratings' },
  { path: '/product-comparison', label: 'Product Comparison' },
  { path: '/partner-directory', label: 'Partner Directory' },
  { path: '/activity-feed', label: 'Activity Feed' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/support', label: 'Support' },
  { path: '/assistant', label: 'Assistant' },
  { path: '/invoice', label: 'Invoice' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/faq', label: 'FAQ' },
  { path: '/help-center', label: 'Help Center' },
  { path: '/shipping-info', label: 'Shipping Info' },
  { path: '/buyer-protection', label: 'Buyer Protection' },
  { path: '/sell-with-us', label: 'Sell With Us' },
  { path: '/privacy-settings', label: 'Privacy Settings' },
  { path: '/order-history', label: 'Order History' },
  { path: '/referral-program', label: 'Referral Program' },
  { path: '/creator-showcase', label: 'Creator Showcase' },
  { path: '/order-tracking', label: 'Order Tracking' },
  { path: '/dispute-center', label: 'Dispute Center' },
  { path: '/seller-application', label: 'Seller Application' },
  { path: '/shipping-calculator', label: 'Shipping Calculator' },
  { path: '/pickup-points', label: 'Pickup Points' },
  { path: '/terms-of-service', label: 'Terms of Service' },
  { path: '/support-tickets', label: 'Support Tickets' },
  { path: '/platform-guidelines', label: 'Platform Guidelines' },
  { path: '/checkout-success', label: 'Checkout Success' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/developers', label: 'Developer Portal' },
  { path: '/mentions-legales', label: 'Mentions Legales' },
  { path: '/cgv', label: 'CGV' },
  { path: '/confidentialite', label: 'Confidentialite' },
  // Auth protected routes (will redirect unauthenticated users)
  { path: '/messages', label: 'Messages' },
  { path: '/payout-requests', label: 'Payout Requests' },
  { path: '/dispute-resolution', label: 'Dispute Resolution' },
  { path: '/subscription-plans', label: 'Subscription Plans' },
];

export default function NavLinks() {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Explore the site</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {routes.map((r) => (
          <li key={r.path}>
            <Link to={r.path} className="block p-3 rounded bg-slate-200 hover:bg-slate-300">
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
