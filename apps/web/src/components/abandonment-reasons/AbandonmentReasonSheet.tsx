/**
 * AbandonmentReasonSheet — Bottom sheet para criar/editar motivos de desistência
 *
 * Mesmo padrão de ServiceTypeSheet (Story 2.1): div fixa na base, slide-up via Tailwind.
 * Comportamento:
 *   - Modo "create": campo Nome (obrigatório, mín. 3 chars)
 *   - Modo "edit": Nome preenchido + toggle Ativo/Inativo
 */
import { useEffect, useRef, useState } from 'react';
import type { AbandonmentReason } from '../../services/abandonmentReasons.service.js';
import {
  useCreateAbandonmentReason,
  useUpdateAbandonmentReason,
} from '../../hooks/useAbandonmentReasons.js';

interface AbandonmentReasonSheetProps {
  open: boolean;
  reason?: AbandonmentReason | null; // null/undefined = modo create
  onClose: () => void;
}

interface FormValues {
  label: string;
  is_active: boolean;
}

interface FormErrors {
  label?: string;
}

export default function AbandonmentReasonSheet({
  open,
  reason,
  onClose,
}: AbandonmentReasonSheetProps) {
  const isEditMode = Boolean(reason);

  const [values, setValues] = useState<FormValues>({
    label: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ label?: boolean }>({});

  const createMutation = useCreateAbandonmentReason();
  const updateMutation = useUpdateAbandonmentReason();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const labelInputRef = useRef<HTMLInputElement>(null);

  // Preenche ou reseta formulário quando abre/fecha ou troca de item
  useEffect(() => {
    if (open) {
      if (reason) {
        setValues({
          label: reason.label,
          is_active: reason.is_active,
        });
      } else {
        setValues({ label: '', is_active: true });
      }
      setErrors({});
      setTouched({});
      setTimeout(() => labelInputRef.current?.focus(), 100);
    }
  }, [open, reason]);

  function validate(vals: FormValues): FormErrors {
    const errs: FormErrors = {};
    if (!vals.label.trim()) {
      errs.label = 'Nome é obrigatório.';
    } else if (vals.label.trim().length < 3) {
      errs.label = 'Nome deve ter pelo menos 3 caracteres.';
    }
    return errs;
  }

  function handleBlur() {
    setTouched({ label: true });
    setErrors(validate(values));
  }

  function handleChange(field: keyof FormValues, value: string | boolean) {
    const updated = { ...values, [field]: value };
    setValues(updated);
    if (touched.label) {
      setErrors(validate(updated));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ label: true });

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      if (isEditMode && reason) {
        await updateMutation.mutateAsync({
          id: reason.id,
          data: {
            label: values.label.trim(),
            is_active: values.is_active,
          },
        });
      } else {
        await createMutation.mutateAsync({
          label: values.label.trim(),
        });
      }
      onClose();
    } catch {
      // Erro tratado pelo interceptor do axios — não fecha o sheet
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-40 bg-black/50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label={isEditMode ? 'Editar Motivo de Desistência' : 'Novo Motivo de Desistência'}
    >
      {/* Sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-2xl shadow-xl',
          'px-4 pt-4 pb-8',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {isEditMode ? 'Editar Motivo de Desistência' : 'Novo Motivo de Desistência'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Campo: Nome do motivo */}
          <div className="mb-4">
            <label
              htmlFor="abandonment-reason-label"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nome do motivo <span className="text-red-500">*</span>
            </label>
            <input
              id="abandonment-reason-label"
              ref={labelInputRef}
              type="text"
              value={values.label}
              onChange={(e) => handleChange('label', e.target.value)}
              onBlur={handleBlur}
              placeholder="Ex.: Cliente sem interesse"
              className={[
                'w-full rounded-lg px-3 py-2.5 text-base outline-none transition-colors',
                'border bg-white text-gray-900 placeholder-gray-400',
                touched.label && errors.label
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500',
              ].join(' ')}
              aria-describedby={errors.label ? 'label-error' : undefined}
              aria-invalid={Boolean(touched.label && errors.label)}
            />
            {touched.label && errors.label && (
              <p
                id="label-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.label}
              </p>
            )}
          </div>

          {/* Toggle Ativo/Inativo — apenas em modo edição */}
          {isEditMode && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Status</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('is_active', true)}
                  className={[
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    values.is_active
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                      : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                  aria-pressed={values.is_active}
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('is_active', false)}
                  className={[
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    !values.is_active
                      ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400'
                      : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                  aria-pressed={!values.is_active}
                >
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  Inativo
                </button>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-orange-500 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
