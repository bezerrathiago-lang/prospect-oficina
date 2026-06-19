/**
 * ServiceTypeSheet — Bottom sheet para criar/editar tipos de serviço
 *
 * Implementado sem biblioteca externa: div fixa na base com animação slide-up via Tailwind.
 * Comportamento:
 *   - Modo "create": formulário com Nome + Antecedência (padrão 15 dias)
 *   - Modo "edit": preenche dados existentes + toggle Ativo/Inativo
 */
import { useEffect, useRef, useState } from 'react';
import type { ServiceType } from '../../services/serviceTypes.service.js';
import { useCreateServiceType, useUpdateServiceType } from '../../hooks/useServiceTypes.js';

interface ServiceTypeSheetProps {
  open: boolean;
  serviceType?: ServiceType | null; // null/undefined = modo create
  onClose: () => void;
}

interface FormValues {
  name: string;
  contact_lead_days: string;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  contact_lead_days?: string;
}

export default function ServiceTypeSheet({
  open,
  serviceType,
  onClose,
}: ServiceTypeSheetProps) {
  const isEditMode = Boolean(serviceType);

  const [values, setValues] = useState<FormValues>({
    name: '',
    contact_lead_days: '15',
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ name?: boolean; contact_lead_days?: boolean }>({});

  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Preenche ou reseta formulário quando o sheet abre/fecha ou troca de item
  useEffect(() => {
    if (open) {
      if (serviceType) {
        setValues({
          name: serviceType.name,
          contact_lead_days: String(serviceType.contact_lead_days),
          is_active: serviceType.is_active,
        });
      } else {
        setValues({ name: '', contact_lead_days: '15', is_active: true });
      }
      setErrors({});
      setTouched({});
      // Foca no primeiro campo após abertura
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open, serviceType]);

  function validate(vals: FormValues): FormErrors {
    const errs: FormErrors = {};

    if (!vals.name.trim()) {
      errs.name = 'Nome é obrigatório.';
    }

    const days = parseInt(vals.contact_lead_days, 10);
    if (!vals.contact_lead_days || isNaN(days)) {
      errs.contact_lead_days = 'Antecedência é obrigatória.';
    } else if (!Number.isInteger(days) || days < 1) {
      errs.contact_lead_days = 'Deve ser um número inteiro positivo.';
    }

    return errs;
  }

  function handleBlur(field: keyof FormErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(values);
    setErrors(errs);
  }

  function handleChange(field: keyof FormValues, value: string | boolean) {
    const updated = { ...values, [field]: value };
    setValues(updated);
    // Revalida o campo tocado em tempo real
    if (touched[field as keyof FormErrors]) {
      setErrors(validate(updated));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, contact_lead_days: true });

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const days = parseInt(values.contact_lead_days, 10);

    try {
      if (isEditMode && serviceType) {
        await updateMutation.mutateAsync({
          id: serviceType.id,
          data: {
            name: values.name.trim(),
            contact_lead_days: days,
            is_active: values.is_active,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          contact_lead_days: days,
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
      aria-label={isEditMode ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
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
          {isEditMode ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Campo: Nome */}
          <div className="mb-4">
            <label
              htmlFor="service-type-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="service-type-name"
              ref={nameInputRef}
              type="text"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Ex.: Troca de Óleo"
              className={[
                'w-full rounded-lg px-3 py-2.5 text-base outline-none transition-colors',
                'border bg-white text-gray-900 placeholder-gray-400',
                touched.name && errors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500',
              ].join(' ')}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={Boolean(touched.name && errors.name)}
            />
            {touched.name && errors.name && (
              <p
                id="name-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Campo: Antecedência em dias */}
          <div className="mb-5">
            <label
              htmlFor="service-type-days"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Antecedência para contato (dias) <span className="text-red-500">*</span>
            </label>
            <input
              id="service-type-days"
              type="number"
              inputMode="numeric"
              min={1}
              value={values.contact_lead_days}
              onChange={(e) => handleChange('contact_lead_days', e.target.value)}
              onBlur={() => handleBlur('contact_lead_days')}
              placeholder="15"
              className={[
                'w-full rounded-lg px-3 py-2.5 text-base outline-none transition-colors',
                'border bg-white text-gray-900 placeholder-gray-400',
                touched.contact_lead_days && errors.contact_lead_days
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500',
              ].join(' ')}
              aria-describedby={errors.contact_lead_days ? 'days-error' : undefined}
              aria-invalid={Boolean(touched.contact_lead_days && errors.contact_lead_days)}
            />
            {touched.contact_lead_days && errors.contact_lead_days && (
              <p
                id="days-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.contact_lead_days}
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
