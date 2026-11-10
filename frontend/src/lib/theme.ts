export const applyThemeColor = (color: string) => {
	document.documentElement.style.setProperty('--primary', color)
	document.documentElement.style.setProperty('--ring', color)
}
