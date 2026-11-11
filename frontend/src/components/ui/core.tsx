import React, { useState } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check, ChevronDown, Eye, EyeOff, LoaderCircle, X } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
  loading?: boolean
  icon?: React.ReactNode
  block?: boolean
  size?: 'small' | 'middle' | 'large'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'outline', type = 'button', loading, icon, block, size = 'middle', className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'border-primary bg-primary text-primary-foreground hover:brightness-95',
        variant === 'outline' && 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'border-transparent bg-transparent hover:bg-accent',
        variant === 'destructive' && 'border-destructive bg-destructive text-white hover:bg-destructive/90',
        variant === 'link' && 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline',
        size === 'small' && 'h-8 px-3',
        size === 'middle' && 'h-9 px-4',
        size === 'large' && 'h-11 px-6 text-base',
        block && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  allowClear?: boolean
}

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(({ prefix, suffix, allowClear, className, value, onChange, ...props }, ref) => (
  <div
    className={cn(
      'flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs focus-within:ring-2 focus-within:ring-ring',
      className
    )}
  >
    {prefix && <span className="shrink-0 text-muted-foreground">{prefix}</span>}
    <input
      ref={ref}
      value={value}
      onChange={onChange}
      className="h-9 min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
    {allowClear && value !== undefined && value !== '' && (
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        aria-label="清空"
        onClick={() => onChange?.({ target: { value: '' } } as any)}
      >
        <X className="size-3.5" />
      </button>
    )}
    {suffix && <span className="shrink-0 text-muted-foreground">{suffix}</span>}
  </div>
))
InputBase.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { autoSize?: boolean | { minRows?: number; maxRows?: number }; showCount?: boolean }
>(({ autoSize, showCount, className, value, ...props }, ref) => {
  const minRows = typeof autoSize === 'object' ? autoSize.minRows : undefined
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        value={value}
        rows={props.rows || minRows}
        className={cn(
          'min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {showCount && <div className="text-right text-xs text-muted-foreground">{String(value || '').length}</div>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(({ suffix, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  return (
    <InputBase
      ref={ref}
      type={visible ? 'text' : 'password'}
      suffix={
        suffix || (
          <button type="button" onClick={() => setVisible(current => !current)} aria-label={visible ? '隐藏密码' : '显示密码'}>
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )
      }
      {...props}
    />
  )
})
PasswordInput.displayName = 'PasswordInput'

export const Input = InputBase

export const NumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'value' | 'onChange'> & { value?: number | string; onChange?: (value?: number) => void }
>(({ onChange, ...props }, ref) => (
  <InputBase ref={ref} type="number" onChange={event => onChange?.(event.target.value === '' ? undefined : Number(event.target.value))} {...props} />
))
NumberInput.displayName = 'NumberInput'

export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  children?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, indeterminate, onCheckedChange, disabled, children, className, onClick, ...props }, ref) => (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm', disabled && 'cursor-not-allowed opacity-50', className)}>
      <CheckboxPrimitive.Root
        ref={ref}
        checked={indeterminate ? 'indeterminate' : checked}
        disabled={disabled}
        className="peer size-4 shrink-0 rounded border border-primary shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
        onClick={event => {
          event.stopPropagation()
          onClick?.(event)
        }}
        onCheckedChange={value => onCheckedChange?.(value === true)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="grid place-items-center text-current">
          {indeterminate ? <span className="h-0.5 w-2 bg-current" /> : <Check className="size-3" />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {children}
    </label>
  )
)
Checkbox.displayName = 'Checkbox'

interface CheckedChangeEvent {
  target: { checked: boolean }
  stopPropagation: () => void
}

export const Switch = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, 'onChange'> & {
    onChange?: (event: CheckedChangeEvent) => void
    checkedChildren?: React.ReactNode
    unCheckedChildren?: React.ReactNode
  }
>(({ checked, onChange, checkedChildren, unCheckedChildren, className, ...props }, ref) => (
  <div className="inline-flex items-center gap-2">
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={value => onChange?.({ target: { checked: value }, stopPropagation: () => undefined })}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-input transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
    </SwitchPrimitive.Root>
    {(checkedChildren || unCheckedChildren) && <span className="text-sm text-muted-foreground">{checked ? checkedChildren : unCheckedChildren}</span>}
  </div>
))
Switch.displayName = 'Switch'

interface SelectOption {
  label: React.ReactNode
  value: any
  disabled?: boolean
}

interface SelectProps {
  value?: any
  defaultValue?: any
  onChange?: (value: any) => void
  options?: SelectOption[]
  placeholder?: string
  mode?: 'tags' | 'multiple'
  tokenSeparators?: string[]
  prefix?: React.ReactNode
  className?: string
  disabled?: boolean
}

const TagsSelect = ({ value, onChange, placeholder, tokenSeparators = [',', '，'], prefix, className, disabled }: SelectProps) => {
  const [input, setInput] = useState('')
  const values = Array.isArray(value) ? value : []
  const commit = () => {
    const nextItems = tokenSeparators.reduce<string[]>((items, separator) => items.flatMap(item => item.split(separator)), [input])
    const next = nextItems.map(item => item.trim()).filter(Boolean)
    if (next.length) onChange?.([...new Set([...values, ...next])])
    setInput('')
  }

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 shadow-xs focus-within:ring-2 focus-within:ring-ring',
        className
      )}
    >
      {prefix}
      {values.map(item => (
        <span key={item} className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs">
          {item}
          <button type="button" onClick={() => onChange?.(values.filter(valueItem => valueItem !== item))}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        disabled={disabled}
        placeholder={values.length ? '' : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        onChange={event => setInput(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter' || tokenSeparators.includes(event.key)) {
            event.preventDefault()
            commit()
          }
        }}
      />
    </div>
  )
}

const toSelectValue = (value: any) => `option:${String(value)}`

export const Select = ({ value, defaultValue, onChange, options = [], placeholder, mode, className, disabled, ...props }: SelectProps) => {
  if (mode === 'tags' || mode === 'multiple')
    return <TagsSelect value={value} onChange={onChange} placeholder={placeholder} mode={mode} className={className} disabled={disabled} {...props} />
  const selected = value ?? defaultValue
  return (
    <SelectPrimitive.Root
      value={selected === undefined ? undefined : toSelectValue(selected)}
      onValueChange={next => onChange?.(options.find(option => toSelectValue(option.value) === next)?.value ?? next)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:ring-2 focus:ring-ring data-placeholder:text-muted-foreground',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          className="z-1200 max-h-72 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map(option => (
              <SelectPrimitive.Item
                key={toSelectValue(option.value)}
                value={toSelectValue(option.value)}
                disabled={option.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-disabled:cursor-not-allowed data-disabled:opacity-50"
              >
                <span className="absolute left-2 grid size-4 place-items-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

interface UploadProps {
  beforeUpload?: (file: File, fileList: File[]) => any
  accept?: string
  multiple?: boolean
  children?: React.ReactNode
  disabled?: boolean
}

export const Upload = ({ beforeUpload, accept, multiple, children, disabled }: UploadProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const trigger = React.isValidElement<{ disabled?: boolean }>(children)
    ? React.cloneElement(children, { disabled: disabled || children.props.disabled })
    : children

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={event => {
          const files = Array.from(event.target.files || [])
          files.forEach(file => beforeUpload?.(file, files))
          event.target.value = ''
        }}
      />
      <span className={cn('inline-flex', disabled && 'opacity-50')} onClick={() => inputRef.current?.click()}>
        {trigger}
      </span>
    </>
  )
}

interface DatePickerProps {
  value?: any
  onChange?: (value: any) => void
  picker?: 'date' | 'month' | 'year'
  showTime?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const DatePicker = ({ value, onChange, picker = 'date', showTime, placeholder, className, disabled }: DatePickerProps) => {
  const type = showTime ? 'datetime-local' : picker === 'month' ? 'month' : picker === 'year' ? 'number' : 'date'
  const format = showTime ? 'YYYY-MM-DDTHH:mm' : picker === 'month' ? 'YYYY-MM' : picker === 'year' ? 'YYYY' : 'YYYY-MM-DD'
  const displayValue = value?.format ? value.format(format) : value || ''
  return (
    <input
      type={type}
      value={displayValue}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      onChange={event => onChange?.(event.target.value ? dayjs(picker === 'year' ? `${event.target.value}-01-01` : event.target.value) : undefined)}
    />
  )
}

const rgbToHex = (value: string) => {
  if (value.startsWith('#')) return value.slice(0, 7)
  const channels = value.match(/\d+/g)?.slice(0, 3).map(Number)
  return channels?.length === 3 ? `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}` : '#1890ff'
}

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'size'> {
  value?: string
  onChange?: (color: string) => void
}

export const ColorPicker = ({ value = '#1890ff', onChange, className, ...props }: ColorPickerProps) => (
  <input
    type="color"
    value={rgbToHex(value)}
    className={cn('h-8 w-10 cursor-pointer rounded border border-input bg-background p-1', className)}
    onChange={event => onChange?.(event.target.value)}
    {...props}
  />
)
