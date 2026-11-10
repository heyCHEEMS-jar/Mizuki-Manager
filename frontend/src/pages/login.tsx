import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, PasswordInput } from '../components/ui'
import { notify } from '../lib/notify'
import { login, refreshCaptchaBase64 } from '../services/auth'
import { formatTimeDisplay } from '../utils/util'

interface LoginInput {
	username: string
	password: string
	captcha?: string
}

const initialValues: LoginInput = { username: '', password: '', captcha: '' }

export default function Login() {
	const [values, setValues] = useState(initialValues)
	const [loading, setLoading] = useState(false)
	const [captchaBase64, setCaptchaBase64] = useState('')
	const navigate = useNavigate()

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		try {
			setLoading(true)
			const res = await login(values)
			const token = res.data?.token
			if (!token) return
			sessionStorage.setItem('token', token)
			localStorage.setItem('token', token)
			navigate('/')
			notify.success('欢迎回来')
		} catch (err: any) {
			if (err.data?.captchaBase64) setCaptchaBase64(err.data.captchaBase64)
		} finally {
			setLoading(false)
		}
	}

	const refreshCaptcha = async () => {
		if (!values.username) {
			notify.warning('请先输入用户名')
			return
		}
		try {
			setLoading(true)
			const res = await refreshCaptchaBase64({ username: values.username })
			if (res.data?.captchaBase64) setCaptchaBase64(res.data.captchaBase64)
		} catch {
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
			<section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
				<div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/15" />
				<div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/10 blur-3xl" />
				<div className="relative flex items-center gap-3">
					<span className="grid size-11 place-items-center rounded-xl bg-white text-xl font-bold text-primary shadow-lg">M</span>
					<div>
						<div className="font-semibold tracking-wide">MIZUKI MANAGER</div>
						<div className="text-sm text-white/70">Mizuki 博客管理器</div>
					</div>
				</div>
				<div className="relative max-w-xl pb-12">
					<p className="text-sm font-medium uppercase tracking-[0.22em] text-white/65">Content workspace</p>
					<h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">让内容管理保持简单、清晰且专注。</h1>
					<p className="mt-5 max-w-lg leading-7 text-white/75">集中管理博客内容、媒体资源与站点配置。</p>
				</div>
				<div className="relative flex items-center gap-2 text-sm text-white/65">
					<ShieldCheck className="size-4" />
					仅限授权用户访问
				</div>
			</section>

			<section className="flex items-center justify-center px-4 py-10 sm:px-8">
				<div className="w-full max-w-sm">
					<div className="mb-8 lg:hidden">
						<div className="flex items-center gap-3">
							<span className="grid size-10 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">M</span>
							<div>
								<div className="font-semibold">Mizuki Manager</div>
								<div className="text-xs text-muted-foreground">博客内容管理</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
						<div className="mb-7">
							<h2 className="text-2xl font-semibold tracking-tight">登录管理后台</h2>
							<p className="mt-2 text-sm text-muted-foreground">请输入管理员账号和密码继续。</p>
						</div>

						<form className="space-y-5" onSubmit={handleLogin}>
							<div className="space-y-2">
								<label htmlFor="username" className="text-sm font-medium">用户名</label>
								<Input
									id="username"
									value={values.username}
									prefix={<UserRound className="size-4" />}
									placeholder="请输入用户名"
									autoComplete="username"
									disabled={loading}
									required
									onChange={(event) => {
										setValues((current) => ({ ...current, username: event.target.value, captcha: '' }))
										setCaptchaBase64('')
									}}
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="password" className="text-sm font-medium">密码</label>
								<PasswordInput
									id="password"
									value={values.password}
									prefix={<LockKeyhole className="size-4" />}
									placeholder="请输入密码"
									autoComplete="current-password"
									disabled={loading}
									required
									onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
								/>
							</div>

							{captchaBase64 && (
								<div className="space-y-2">
									<label htmlFor="captcha" className="text-sm font-medium">验证码</label>
									<div className="flex items-stretch gap-2">
										<Input
											id="captcha"
											value={values.captcha}
											placeholder="请输入验证码"
											autoComplete="off"
											disabled={loading}
											required
											onChange={(event) => setValues((current) => ({ ...current, captcha: event.target.value }))}
										/>
										<button
											type="button"
											className="group relative w-28 shrink-0 overflow-hidden rounded-md border bg-muted"
											onClick={refreshCaptcha}
											disabled={loading}
											title="点击刷新验证码"
										>
											<img src={captchaBase64} className="size-full object-contain" alt="验证码" />
											<span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white group-hover:flex">
												<RefreshCw className="size-4" />
											</span>
										</button>
									</div>
								</div>
							)}

							<div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
								<button type="button" className="text-primary hover:underline" onClick={() => notify.warning('默认账号密码在 .env 环境变量配置文件中更改')}>
									忘记密码？
								</button>
								<span>登录有效期：{formatTimeDisplay(process.env.TOKEN_EXPIRES_IN || '')}</span>
							</div>

							<Button type="submit" variant="default" block loading={loading} size="large" className="mt-1">
								登录
								{!loading && <ArrowRight className="size-4" />}
							</Button>
						</form>
					</div>
				</div>
			</section>
		</main>
	)
}
