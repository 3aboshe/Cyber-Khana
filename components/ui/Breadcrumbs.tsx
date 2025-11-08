import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/dashboard' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Don't add a link for the last segment if it's an ID
      const isLast = index === pathSegments.length - 1;
      const isId = segment.length === 24 || /^[0-9a-f]{24}$/i.test(segment);

      breadcrumbs.push({
        label,
        path: isLast && isId ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-2 text-sm mb-6"
    >
      <Link
        to="/dashboard"
        className="flex items-center text-zinc-400 hover:text-emerald-400 transition-colors"
      >
        <Home size={16} />
      </Link>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={16} className="text-zinc-600" />
          {item.path ? (
            <Link
              to={item.path}
              className="text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-200 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
