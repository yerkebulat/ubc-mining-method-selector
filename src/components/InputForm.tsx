'use client';

import { useForm, Controller, Control, FieldErrors } from 'react-hook-form';
import { Info } from 'lucide-react';
import { getConfig } from '@/lib/scoring-engine';
import type { InputValues } from '@/types';
import { cn } from '@/lib/utils';

interface InputFormProps {
  onSubmit: (data: InputValues) => void;
  defaultValues?: Partial<InputValues>;
  isCalculating?: boolean;
}

const config = getConfig();

interface SelectFieldProps {
  name: keyof InputValues;
  control: Control<InputValues>;
  errors: FieldErrors<InputValues>;
}

function SelectField({ name, control, errors }: SelectFieldProps) {
  const factor = config.factors[name];
  if (!factor) return null;

  return (
    <div>
      <label htmlFor={name} className="label flex items-center gap-1">
        {factor.label}
        <span className="group relative">
          <Info className="h-4 w-4 text-mining-400 cursor-help" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-64 rounded-lg bg-mining-900 p-2 text-xs text-white shadow-lg group-hover:block z-50">
            {factor.tooltip}
          </span>
        </span>
      </label>
      <Controller
        name={name}
        control={control}
        rules={{ required: `${factor.label} is required` }}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            className={cn(
              'select',
              errors[name] && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
          >
            <option value="">Select {factor.label.toLowerCase()}...</option>
            {factor.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
      )}
    </div>
  );
}

export function InputForm({ onSubmit, defaultValues, isCalculating }: InputFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputValues>({
    defaultValues: {
      shape: '',
      thickness: '',
      plunge: '',
      grade: '',
      depth: '',
      rmr_ore: '',
      rss_ore: '',
      rmr_hw: '',
      rss_hw: '',
      rmr_fw: '',
      rss_fw: '',
      ...defaultValues,
    },
  });

  const handleReset = () => {
    reset({
      shape: '',
      thickness: '',
      plunge: '',
      grade: '',
      depth: '',
      rmr_ore: '',
      rss_ore: '',
      rmr_hw: '',
      rss_hw: '',
      rmr_fw: '',
      rss_fw: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Geometry & Grade Distribution */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Geometry &amp; Grade Distribution</h2>
          <p className="mt-1 text-sm text-mining-500">
            Define the physical characteristics and grade distribution of the deposit
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="shape" control={control} errors={errors} />
          <SelectField name="thickness" control={control} errors={errors} />
          <SelectField name="plunge" control={control} errors={errors} />
          <SelectField name="grade" control={control} errors={errors} />
          <SelectField name="depth" control={control} errors={errors} />
        </div>
      </div>

      {/* Ore Zone Rock Mechanics */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Ore Zone Rock Mechanics</h2>
          <p className="mt-1 text-sm text-mining-500">
            Rock Mass Rating (RMR) and Rock Substance Strength (RSS) for the ore zone
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="rmr_ore" control={control} errors={errors} />
          <SelectField name="rss_ore" control={control} errors={errors} />
        </div>
      </div>

      {/* Hanging Wall Rock Mechanics */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Hanging Wall Rock Mechanics</h2>
          <p className="mt-1 text-sm text-mining-500">
            Rock Mass Rating (RMR) and Rock Substance Strength (RSS) for the hanging
            wall (overlying rock)
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="rmr_hw" control={control} errors={errors} />
          <SelectField name="rss_hw" control={control} errors={errors} />
        </div>
      </div>

      {/* Footwall Rock Mechanics */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Footwall Rock Mechanics</h2>
          <p className="mt-1 text-sm text-mining-500">
            Rock Mass Rating (RMR) and Rock Substance Strength (RSS) for the footwall
            (underlying rock)
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="rmr_fw" control={control} errors={errors} />
          <SelectField name="rss_fw" control={control} errors={errors} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isCalculating}
          className="btn-primary flex items-center gap-2"
        >
          {isCalculating ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4z"
                />
              </svg>
              Calculating...
            </>
          ) : (
            'Calculate Scores'
          )}
        </button>
        <button type="button" onClick={handleReset} className="btn-outline">
          Reset Form
        </button>
      </div>
    </form>
  );
}
