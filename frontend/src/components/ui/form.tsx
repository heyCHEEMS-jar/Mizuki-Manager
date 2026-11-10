import React, { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

type NamePath = string | number | Array<string | number>
type Rule = {
	required?: boolean
	message?: string
	validator?: (rule: Rule, value: any) => Promise<void> | void
}

type FieldRegistration = {
	id: number
	name: NamePath
	label?: React.ReactNode
	rules: Rule[]
}

interface FormCallbacks {
	onValuesChange?: (changedValues: any, values: any) => void
}

const isPlainObject = (value: any): value is Record<string, any> =>
	value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype

const cloneValue = (value: any): any => {
	if (Array.isArray(value)) return value.map(cloneValue)
	if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]))
	return value
}

const mergeValues = (target: any, source: any): any => {
	if (!isPlainObject(source)) return cloneValue(source)
	const result = isPlainObject(target) ? { ...target } : {}
	for (const [key, value] of Object.entries(source)) {
		result[key] = isPlainObject(value) ? mergeValues(result[key], value) : cloneValue(value)
	}
	return result
}

const toPath = (name: NamePath): Array<string | number> => (Array.isArray(name) ? name : [name])
const pathKey = (name: NamePath) => JSON.stringify(toPath(name))

const getAtPath = (source: any, name: NamePath) => {
	let value = source
	for (const key of toPath(name)) {
		if (value === null || value === undefined) return undefined
		value = value[key]
	}
	return value
}

const setAtPath = (source: any, name: NamePath, value: any) => {
	const path = toPath(name)
	const root = cloneValue(source) || {}
	let current = root
	for (let index = 0; index < path.length - 1; index++) {
		const key = path[index]
		const nextKey = path[index + 1]
		if (current[key] === undefined || current[key] === null) current[key] = typeof nextKey === 'number' ? [] : {}
		else current[key] = cloneValue(current[key])
		current = current[key]
	}
	current[path[path.length - 1]] = value
	return root
}

const changedObject = (name: NamePath, value: any) => setAtPath({}, name, value)
const isEmpty = (value: any) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

export interface FormInstance {
	getValue: (name: NamePath) => any
	getValues: () => any
	setValue: (name: NamePath, value: any, triggerChange?: boolean) => void
	setValues: (values: any) => void
	reset: () => void
	validate: () => Promise<any>
	subscribe: (listener: () => void) => () => void
	getVersion: () => number
	getError: (name: NamePath) => string | undefined
	registerField: (name: NamePath, rules?: Rule[], label?: React.ReactNode) => () => void
	setInitialValues: (values?: any) => void
	setCallbacks: (callbacks: FormCallbacks) => void
}

const createFormInstance = (): FormInstance => {
	let values: any = {}
	let initialValues: any = {}
	let initialized = false
	let version = 0
	let registrationId = 0
	let callbacks: FormCallbacks = {}
	const listeners = new Set<() => void>()
	const fields = new Map<number, FieldRegistration>()
	const errors = new Map<string, string>()

	const notify = () => {
		version += 1
		listeners.forEach((listener) => listener())
	}

	const instance: FormInstance = {
		getValue: (name) => getAtPath(values, name),
		getValues: () => values,
		setValue: (name, value, triggerChange = true) => {
			values = setAtPath(values, name, value)
			errors.delete(pathKey(name))
			notify()
			if (triggerChange) callbacks.onValuesChange?.(changedObject(name, value), values)
		},
		setValues: (nextValues) => {
			values = mergeValues(values, nextValues)
			notify()
		},
		reset: () => {
			values = cloneValue(initialValues)
			errors.clear()
			notify()
		},
		validate: async () => {
			errors.clear()
			for (const field of fields.values()) {
				const value = getAtPath(values, field.name)
				for (const rule of field.rules) {
					try {
						if (rule.required && isEmpty(value)) throw new Error(rule.message || `${field.label || '该字段'}不能为空`)
						await rule.validator?.(rule, value)
					} catch (error: any) {
						errors.set(pathKey(field.name), error?.message || rule.message || '字段校验失败')
						break
					}
				}
			}
			notify()
			if (errors.size) return Promise.reject({ errorFields: [...errors.entries()] })
			return values
		},
		subscribe: (listener) => {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
		getVersion: () => version,
		getError: (name) => errors.get(pathKey(name)),
		registerField: (name, rules = [], label) => {
			const id = registrationId++
			fields.set(id, { id, name, rules, label })
			return () => fields.delete(id)
		},
		setInitialValues: (nextValues = {}) => {
			if (initialized) return
			initialized = true
			initialValues = cloneValue(nextValues)
			values = isPlainObject(values) && Object.keys(values).length ? mergeValues(initialValues, values) : cloneValue(initialValues)
		},
		setCallbacks: (nextCallbacks) => {
			callbacks = nextCallbacks
		}
	}

	return instance
}

const FormContext = createContext<FormInstance | null>(null)
const ListContext = createContext<Array<string | number>>([])

export const useForm = (): FormInstance => {
	const formRef = useRef<FormInstance | null>(null)
	if (!formRef.current) formRef.current = createFormInstance()
	return formRef.current
}

export const useFormWatch = (name: NamePath, form: FormInstance) => {
	useSyncExternalStore(form.subscribe, form.getVersion, form.getVersion)
	return form.getValue(name)
}

interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onChange'> {
	form?: FormInstance
	initialValues?: any
	onValuesChange?: (changedValues: any, values: any) => void
}

export const Form = ({ form: providedForm, initialValues, onValuesChange, children, className, ...props }: FormProps) => {
	const internalForm = useForm()
	const form = providedForm || internalForm
	form.setInitialValues(initialValues)
	form.setCallbacks({ onValuesChange })

	return (
		<FormContext.Provider value={form}>
			<form
				className={cn('space-y-1', className)}
				onSubmit={(event) => event.preventDefault()}
				{...props}
			>
				{children}
			</form>
		</FormContext.Provider>
	)
}

interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	name?: NamePath
	label?: React.ReactNode
	rules?: Rule[]
	valueKey?: 'value' | 'checked'
	unstyled?: boolean
	observe?: boolean | ((previous: any, current: any) => boolean)
	children?: React.ReactNode | ((form: FormInstance) => React.ReactNode)
}

export const FormField = ({ name, label, rules = [], valueKey = 'value', unstyled, observe, children, className, ...props }: FormFieldProps) => {
	const form = useContext(FormContext)
	const listPath = useContext(ListContext)
	if (!form) throw new Error('FormField 必须在 Form 内使用')
	const fieldName = name === undefined ? undefined : [...listPath, ...toPath(name)]
	useSyncExternalStore(form.subscribe, form.getVersion, form.getVersion)

	useEffect(() => {
		if (fieldName === undefined) return
		return form.registerField(fieldName, rules, label)
	}, [form, pathKey(fieldName ?? ''), rules, label])

	if (typeof children === 'function') return <>{children(form)}</>

	let content = children
	if (fieldName !== undefined && React.isValidElement<any>(children)) {
		const child = children as React.ReactElement<any>
		const value = form.getValue(fieldName)
		const previousOnChange = child.props.onChange
		content = React.cloneElement(child, {
			[valueKey]: valueKey === 'checked' ? Boolean(value) : value ?? '',
			onChange: (...args: any[]) => {
				previousOnChange?.(...args)
				const first = args[0]
				const nextValue = first?.target ? first.target[valueKey] : first
				form.setValue(fieldName, nextValue)
			}
		})
	}

	if (unstyled || observe) return <>{content}</>
	const error = fieldName === undefined ? undefined : form.getError(fieldName)

	return (
		<div className={cn('mb-4 grid gap-2', className)} {...props}>
			{label !== undefined && <label className="text-sm font-medium leading-none">{label}</label>}
			{content}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	)
}

interface FormListProps {
	name: NamePath
	children: (fields: Array<{ key: React.Key; name: number }>, operations: { add: (value?: any) => void; remove: (index: number) => void }) => React.ReactNode
}

export const FormList = ({ name, children }: FormListProps) => {
	const form = useContext(FormContext)
	const listPath = useContext(ListContext)
	if (!form) throw new Error('FormList 必须在 Form 内使用')
	const fieldName = [...listPath, ...toPath(name)]
	useSyncExternalStore(form.subscribe, form.getVersion, form.getVersion)
	const value = form.getValue(fieldName)
	const list = Array.isArray(value) ? value : []
	const fields = list.map((_, index) => ({ key: index, name: index }))

	return (
		<ListContext.Provider value={fieldName}>
			{children(fields, {
				add: (item = undefined) => form.setValue(fieldName, [...list, item]),
				remove: (index) => form.setValue(fieldName, list.filter((_, itemIndex) => itemIndex !== index))
			})}
		</ListContext.Provider>
	)
}
