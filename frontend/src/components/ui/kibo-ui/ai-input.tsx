
import { ChevronDown, Loader2Icon, SendIcon, SquareIcon, XIcon } from 'lucide-react';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { Children, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
type UseAutoResizeTextareaProps = {
  minHeight: number;
  maxHeight?: number;
};
const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;
      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );
  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);
  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);
  return { textareaRef, adjustHeight };
};

//whole <div> 
export type AIInputProps = HTMLAttributes<HTMLFormElement>;
export const AIInput = ({ className, ...props }: AIInputProps) => (
  <form
    className={cn(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm p-2',
      className
    )}
    {...props}
  />
);

//query input textarea 
export type AIInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};
export const AIInputTextarea = ({
  onChange,
  className,
  placeholder = 'Ask about data...',
  minHeight = 48,
  maxHeight = 164,
  ...props
}: AIInputTextareaProps) => {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };
  return (
    <Textarea
      className={cn(
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'bg-transparent dark:bg-transparent',
        'focus-visible:ring-0',
        className
      )}
      name="message"
      onChange={(e) => {
        adjustHeight();
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      ref={textareaRef}
      {...props}
    />
  );
};

//<div> in center
export type AIInputToolbarProps = HTMLAttributes<HTMLDivElement>;
export const AIInputToolbar = ({
  className,
  ...props
}: AIInputToolbarProps) => (
  <div
    className={cn('flex items-center justify-between p-1', className)}
    {...props}
  />
);
export type AIInputToolsProps = HTMLAttributes<HTMLDivElement>;
export const AIInputTools = ({ className, ...props }: AIInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-1',
      className
    )}
    {...props}
  />
);

//
export type AIInputButtonProps = ComponentProps<typeof Button>;
export const AIInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: AIInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';
  return (
    <Button
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

//submit button
export type AIInputSubmitProps = ComponentProps<typeof Button> & {
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
};
export const AIInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: AIInputSubmitProps) => {
  let Icon = <SendIcon />;
  if (status === 'submitted') {
    Icon = <Loader2Icon className="animate-spin" />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon />;
  } else if (status === 'error') {
    Icon = <XIcon />;
  }
  return (
    <Button
      className={cn('gap-1.5 rounded-lg rounded-br-xl', className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

//whole selection
export type AIInputModelSelectProps = ComponentProps<typeof Select>;
export const AIInputModelSelect = (props: AIInputModelSelectProps) => (
  <Select {...props} />
);

//button for the whole selection
export type AIInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;
export const AIInputModelSelectTrigger = ({
  className,
  ...props
}: AIInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

//content inside `select`
export type AIInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;
export const AIInputModelSelectContent = ({
  className,
  ...props
}: AIInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

//items inside `content`
export type AIInputModelSelectItemProps = ComponentProps<typeof SelectItem>;
export const AIInputModelSelectItem = ({
  className,
  ...props
}: AIInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

//
export type AIInputModelSelectValueProps = ComponentProps<typeof SelectValue>;
export const AIInputModelSelectValue = ({
  className,
  ...props
}: AIInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

//button for Table-selection
export type AIInputTableToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};
export const AIInputTableToggle = ({
  checked,
  onCheckedChange,
  className,
}: AIInputTableToggleProps) => (
  <div className={cn('flex items-center space-x-2', className)}>
    <Switch
      id="table-select"
      className="rounded-full"
      checked={checked}
      onCheckedChange={onCheckedChange}
    />

  </div>
);

export type Option = { value: string; label: string };
export type AIInputMultiSelectTableProps = {
  options: Option[];
  selected: string[];                     // 外部状态
  onSelectedChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};
export function AIInputMultiSelectTable({
  options,
  selected,
  onSelectedChange,
  disabled,
  placeholder = "選択",
}: AIInputMultiSelectTableProps) {
  const toggle = (v: string) =>
    selected.includes(v)
      ? onSelectedChange(selected.filter((s) => s !== v))
      : onSelectedChange([...selected, v]);

  // const allVisible = options.length === selected.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="gap-1 text-muted-foreground"
        >
          {selected.length === 0 ? placeholder : ` ${selected.length} tables selected`}
          <ChevronDown />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-72">
        <Command>
          {/* Search bar */}
          <CommandInput placeholder="Search table names..." />

          {/* Select/Deselect All */}
          <div className="flex items-center justify-between px-3 py-1 text-xs">
            <button
              className="
                px-1 py-1 text-muted-foreground
                opacity-70
                hover:text-foreground
                hover:opacity-100
                transition-opacity "
              onClick={() => onSelectedChange(options.map((o) => o.value))}>
              Select All
            </button>
            <button
              className="
                px-1 py-1 text-muted-foreground
                opacity-70
                hover:text-foreground
                hover:opacity-100
                transition-opacity "
              onClick={() => onSelectedChange([])}>
              Deselect All
            </button>
          </div>

          {/* items */}
          {options.map((o) => (
            <CommandItem
              key={o.value}
              onSelect={() => toggle(o.value)}
              className="flex gap-2"
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0 transition",
                  selected.includes(o.value)
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              {o.label}
            </CommandItem>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  );
}