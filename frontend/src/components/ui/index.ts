/**
 * UI Primitives - centralized export dla wszystkich komponentów bazowych
 * Używaj: import { Button, Input, Card } from '@/components/ui'
 */

// Buttons & Inputs
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { Input, type InputProps } from './Input';
export { Select, type SelectProps } from './Select';
export { Textarea, type TextareaProps } from './Textarea';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Radio, type RadioProps } from './Radio';

// Layout
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardBodyProps,
  type CardFooterProps,
  type CardVariant,
} from './Card';

// Feedback
export { Alert, type AlertProps, type AlertVariant } from './Alert';
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from './Badge';
export { Spinner, type SpinnerProps, type SpinnerSize, type SpinnerVariant } from './Spinner';
export {
  ToastProvider,
  useToast,
  type Toast,
  type ToastOptions,
  type ToastVariant,
  type ToastPosition,
} from './Toast';

// Overlays
export { Modal, type ModalProps } from './Modal';
export { ConfirmModal, type ConfirmModalProps } from './ConfirmModal';
export { Tooltip, type TooltipProps } from './Tooltip';

// Display
export { Avatar, type AvatarProps, type AvatarSize, type AvatarShape } from './Avatar';
export { Skeleton, type SkeletonProps } from './Skeleton';
