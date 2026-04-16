import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Input } from "./input"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface StepperInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const StepperInput = React.forwardRef<HTMLInputElement, StepperInputProps>(
  ({ className, value, onChange, step = 1, min, max, ...props }, ref) => {
    
    // We want step to be a number for our calculations
    const numericStep = typeof step === 'string' ? parseFloat(step) : Number(step);

    const triggerChange = (newValue: number) => {
      // Simulate an event for react-hook-form
      if (onChange) {
        const event = {
          target: { value: String(newValue), valueAsNumber: newValue, name: props.name },
          currentTarget: { value: String(newValue), valueAsNumber: newValue, name: props.name },
          type: 'change'
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const handleIncrement = () => {
      const current = parseFloat(String(value)) || 0;
      const newValue = current + numericStep;
      if (max !== undefined && newValue > Number(max)) return;
      triggerChange(Number(newValue.toFixed(6)));
    }

    const handleDecrement = () => {
      const current = parseFloat(String(value)) || 0;
      const newValue = current - numericStep;
      if (min !== undefined && newValue < Number(min)) return;
      triggerChange(Number(newValue.toFixed(6)));
    }

    return (
      <div className={cn("flex items-center", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-r-none border-r-0 focus:z-10 bg-muted/20 hover:bg-muted active:bg-muted/60 text-muted-foreground"
          onClick={handleDecrement}
          disabled={min !== undefined && parseFloat(String(value)) <= Number(min)}
          tabIndex={-1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          ref={ref}
          type="number"
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          className="h-8 text-center rounded-none focus-visible:ring-1 focus-visible:z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full px-1 flex-1"
          {...props}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-l-none border-l-0 focus:z-10 bg-muted/20 hover:bg-muted active:bg-muted/60 text-muted-foreground"
          onClick={handleIncrement}
          disabled={max !== undefined && parseFloat(String(value)) >= Number(max)}
          tabIndex={-1}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    )
  }
)
StepperInput.displayName = "StepperInput"
