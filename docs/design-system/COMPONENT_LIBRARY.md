# Component Library

## Overview
The Component Library serves as the comprehensive inventory and usage guide for all reusable React components in the AfriTrade marketplace. It documents component specifications, usage patterns, and implementation guidelines.

## Component Architecture

### Component Types

#### Core Components
- **Structural**: DashboardShell, Container, Section
- **Navigation**: DashboardNav, Breadcrumbs, Pagination
- **Data Display**: ProductCard, StatusBadge, Table, List
- **Form Controls**: Input, Select, Textarea, Checkbox, Radio
- **Feedback**: Alert, Toast, Modal, Drawer
- **Layout**: Grid, Flex, Spacer, Divider

#### Role-Specific Components
- **Seller Dashboard**: SellerProductCard, SellerStats, SellerActions
- **Admin Dashboard**: AdminPanel, UserManagement, Analytics
- **Common**: StatusBadge, ProductCard (shared)

## Component Inventory

### DashboardShell Component
**Purpose**: Shared wrapper for admin and seller dashboards with consistent layout patterns.

**Props**:
- `nav`: Navigation links array (required)
- `title`: Page title (optional)
- `children`: Page content (required)
- `className`: Additional CSS classes (optional)
- `variant`: Visual variant ("default" | "paper")

**Usage**:
```jsx
<DashboardShell
  nav={dashboardNav}
  title="Seller Dashboard"
  variant="paper"
>
  <PageContent />
</DashboardShell>
```

**Styling**: Based on Tailwind CSS custom properties, responsive grid system.

### SellerProductCard Component
**Purpose**: Seller-specific product card with management actions.

**Props**:
- `product`: Product data object (required)
- `onEdit`: Edit handler (required)
- `onToggle`: Publish/archive handler (required)
- `onRemove`: Delete handler (required)
- `ariaEdit`: Edit aria-label (optional)
- `ariaToggle`: Toggle aria-label (optional)
- `ariaDelete`: Delete aria-label (optional)

**Features**:
- Edit, toggle publish/archive, delete functionality
- B2B product information display
- Status badges and inventory indicators
- Responsive design
- Accessibility support (ARIA labels)

**Usage**:
```jsx
<SellerProductCard
  product={productData}
  onEdit={handleEdit}
  onToggle={handleToggle}
  onRemove={handleRemove}
  ariaEdit="Edit product"
  ariaToggle="Publish or archive product"
  ariaDelete="Delete product"
/>
```

### StatusBadge Component
**Purpose**: Standardized status indicator with i18n support.

**Props**:
- `status`: Status string (required)
- `className`: Additional CSS classes (optional)

**Statuses**:
- `pending`, `submitted`, `responded`, `accepted`, `declined`, `expired`
- All statuses translated via i18n

**Usage**:
```jsx
<StatusBadge status="accepted" />
```

### Form Components

#### Input Component
**Purpose**: Standardized text input field.

**Props**:
- `value`: Input value (required)
- `onChange`: Change handler (required)
- `placeholder`: Placeholder text (optional)
- `disabled`: Disabled state (optional)
- `error`: Error state (optional)

**Variants**: Text, email, password, number, search

#### Select Component
**Purpose**: Standardized dropdown selection.

**Props**:
- `value`: Selected value (required)
- `onChange`: Change handler (required)
- `options`: Array of options (required)
- `placeholder`: Placeholder text (optional)
- `disabled`: Disabled state (optional)

**Usage**:
```jsx
<Select
  value={selectedValue}
  onChange={handleChange}
  options={options}
  placeholder="Select an option"
/>
```

## Component Usage Patterns

### Dashboard Layout Pattern
```jsx
<DashboardShell variant="paper">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Product Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <SellerProductCard product={product} />
      </CardContent>
    </Card>
  </div>
</DashboardShell>
```

### Form Pattern
```jsx
<Form>
  <FormField label="Product Name" error={errors.name}>
    <Input
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      placeholder="Enter product name"
    />
  </FormField>
  
  <FormField label="Status" error={errors.status}>
    <Select
      value={formData.status}
      onChange={(value) => setFormData({...formData, status: value})}
      options={statusOptions}
    />
  </FormField>
</Form>
```

## Component Conventions

### Naming Conventions
```jsx
// Component names: PascalCase
<Button>Click me</Button>

// Props: camelCase
<Modal isOpen={showModal} onClose={handleClose} />

// CSS classes: kebab-case
<div className="component-container" />
```

### Props Validation
```jsx
// TypeScript interfaces (example)
interface DashboardShellProps {
  nav: NavItem[];
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'paper';
}
```

### Accessibility Standards
```jsx
// All interactive components must have:
// 1. Keyboard navigation support
// 2. ARIA labels for icon-only buttons
// 3. Focus management for modals
// 4. Screen reader compatibility

// Example:
<button
  onClick={handleClick}
  aria-label="Edit item"
  aria-describedby="description-id"
>
  <Pencil className="h-4 w-4" />
</button>
```

## Component State Management

### Local State Patterns
```jsx
// Form component with controlled inputs
const [formData, setFormData] = useState({
  name: '',
  status: '',
  price: '',
});

const handleChange = (field) => (e) => {
  setFormData({
    ...formData,
    [field]: e.target.value,
  });
};
```

### API Integration Patterns
```jsx
// Data fetching and error handling
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, []);
```

## Component Testing Guidelines

### Unit Testing
```jsx
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react';
import { SellerProductCard } from './SellerProductCard';

describe('SellerProductCard', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    price: 99.99,
    stock: 10,
    status: 'published',
  };

  it('renders product information', () => {
    render(
      <SellerProductCard
        product={mockProduct}
        onEdit={() => {}}
        onToggle={() => {}}
        onRemove={() => {}}
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls edit handler when edit button clicked', () => {
    const mockOnEdit = jest.fn();
    render(
      <SellerProductCard
        product={mockProduct}
        onEdit={mockOnEdit}
        onToggle={() => {}}
        onRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Visual Testing
```jsx
// Visual regression testing example
import { composeStories } from '@storybook/react';
import * as stories from './SellerProductCard.stories';

const { Default } = composeStories(stories);

it('renders correctly', () => {
  const story = Default();
  expect(story).toMatchSnapshot();
});
```

## Component Performance Guidelines

### Optimization Strategies
```jsx
// 1. Memoize expensive calculations
const memoizedCalculation = useMemo(() => {
  return calculateSomething(expensiveData);
}, [expensiveData]);

// 2. Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));

// 3. Debounce search inputs
const debouncedSearch = useCallback(
  debounce((query) => {
    setSearchResults(query);
  }, 300),
  []
);
```

### Memory Management
```jsx
// Cleanup event listeners
useEffect(() => {
  const handleResize = () => {
    // Update component on resize
  };
  
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## Component Documentation

### Component API Documentation
Each component should have comprehensive documentation including:

1. **Purpose**: Component role and responsibilities
2. **Props**: Full prop documentation with types
3. **Usage Examples**: Code examples and best practices
4. **Styling**: CSS classes and customization options
5. **Accessibility**: ARIA and keyboard navigation
6. **Testing**: Test cases and coverage
7. **Known Issues**: Limitations and workarounds

### Component Discovery
Components can be discovered through:
- **Component Index**: Centralized component catalog
- **Storybook**: Interactive component playground
- **Documentation**: Live examples and patterns
- **Code Search**: Component usage analytics

## Component Evolution

### Versioning Strategy
- **Major versions**: Breaking changes and new features
- **Minor versions**: New components and enhancements
- **Patch versions**: Bug fixes and optimizations

### Migration Guidelines
```jsx
// Example migration guide
<MigrationGuide from="v1.0" to="v2.0">
  <Change>
    <Old>OldComponent prop="value" /></Old>
    <New>NewComponent prop="value" /></New>
  </Change>
</MigrationGuide>
```

## Component Dependencies

### Internal Dependencies
- **DashboardShell**: DashboardNav
- **SellerProductCard**: ProductCard, StatusBadge, Edit/Toggle/Delete actions
- **Form Components**: Input, Select, FormField

### External Dependencies
- **React**: Core component library
- **lucide-react**: Icon set
- **Tailwind CSS**: Styling framework
- **react-i18next**: Internationalization
- **shadcn/ui**: Component library

## Component Development Workflow

### Development Process
1. **Discovery**: Identify component needs
2. **Design**: Create component specifications
3. **Implementation**: Build component with tests
4. **Documentation**: Write comprehensive documentation
5. **Testing**: Validate functionality and accessibility
6. **Review**: Peer review and approval
7. **Release**: Publish and version

### Quality Gates
- **Code Review**: Linting, formatting, and style checks
- **Unit Tests**: 100% test coverage for new components
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for production use
- **Documentation**: Complete and accurate documentation

## Component Lifecycle

### Development Phases
- **Planning**: Define component requirements
- **Specification**: Create detailed component spec
- **Implementation**: Build component with best practices
- **Testing**: Validate functionality and edge cases
- **Documentation**: Create usage examples and API docs
- **Maintenance**: Ongoing updates and improvements

### Retirement Criteria
- **Unused**: No active references in codebase
- **Deprecated**: Replaced by newer components
- **Inadequate**: Fails quality or accessibility standards
- **Outdated**: No longer maintained or supported

---

*This Component Library provides the comprehensive foundation for reusable components in the AfriTrade marketplace, ensuring consistency, quality, and maintainability across all user interfaces.*