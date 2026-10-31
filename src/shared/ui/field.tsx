import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, id, className, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("ui-field", className)}>
      <label htmlFor={inputId} className="ui-field__label">
        {label}
      </label>
      <input
        id={inputId}
        className="ui-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...props}
      />
      {message && (
        <p id={messageId} className={error ? "ui-field__error" : "ui-field__hint"}>
          {message}
        </p>
      )}
    </div>
  );
}
