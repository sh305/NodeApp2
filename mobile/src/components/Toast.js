import { useToast, showGlobalToast, ToastProvider } from '../context/ToastContext';

/**
 * Re-export Toast helpers so any component can conveniently import from either:
 * - import { useToast } from '../components/Toast';
 * - import { useToast } from '../context/ToastContext';
 */
export { useToast, showGlobalToast, ToastProvider };
export default useToast;
