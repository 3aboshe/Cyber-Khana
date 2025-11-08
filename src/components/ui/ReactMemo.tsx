import { memo } from 'react';

// Memoized version of the enhanced components for better performance

import EnhancedButton from './EnhancedButton';
import EnhancedCard from './EnhancedCard';
import EnhancedInput from './EnhancedInput';
import MobileNavigation from './MobileNavigation';
import Breadcrumbs from './Breadcrumbs';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import Toast from './Toast';

export const MemoizedButton = memo(EnhancedButton);
export const MemoizedCard = memo(EnhancedCard);
export const MemoizedInput = memo(EnhancedInput);
export const MemoizedMobileNavigation = memo(MobileNavigation);
export const MemoizedBreadcrumbs = memo(Breadcrumbs);
export const MemoizedLoadingSkeleton = memo(LoadingSkeleton);
export const MemoizedEmptyState = memo(EmptyState);
export const MemoizedToast = memo(Toast);

// Re-export with display names
MemoizedButton.displayName = 'MemoizedButton';
MemoizedCard.displayName = 'MemoizedCard';
MemoizedInput.displayName = 'MemoizedInput';
MemoizedMobileNavigation.displayName = 'MemoizedMobileNavigation';
MemoizedBreadcrumbs.displayName = 'MemoizedBreadcrumbs';
MemoizedLoadingSkeleton.displayName = 'MemoizedLoadingSkeleton';
MemoizedEmptyState.displayName = 'MemoizedEmptyState';
MemoizedToast.displayName = 'MemoizedToast';
