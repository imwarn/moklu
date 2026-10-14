/** Original Moklu SVG browser chrome, drawn over the screenshot viewport. */
const rect = (fill: string, header: string, height: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
<rect x="1" y="1" width="1198" height="748" rx="19" fill="${fill}" stroke="#000000" stroke-opacity=".20" stroke-width="2"/>
<path d="M20 1 H1180 Q1199 1 1199 20 V${height} H1 V20 Q1 1 20 1Z" fill="${header}"/>
<circle cx="30" cy="29" r="7" fill="#ff605b"/><circle cx="53" cy="29" r="7" fill="#ffbd45"/><circle cx="76" cy="29" r="7" fill="#00c748"/>
<rect x="220" y="13" width="760" height="32" rx="9" fill="#ffffff" fill-opacity=".09"/>
<path d="M1 ${height} H1199" stroke="#000000" stroke-opacity=".13"/>
<rect x="1" y="1" width="1198" height="748" rx="19" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>
</svg>`

export const BROWSER_CHROME_SVG = rect('#181e2b', '#252d3d', 58)
export const BROWSER_SAFARI_SVG = rect('#e9edf2', '#eef0f5', 58)
export const BROWSER_MINIMAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
<rect x="1" y="1" width="1198" height="748" rx="18" fill="#f9fafb" stroke="#000000" stroke-opacity=".22" stroke-width="2"/>
<path d="M20 1 H1180 Q1199 1 1199 20 V42 H1 V20 Q1 1 20 1Z" fill="#f3f4f6"/>
<circle cx="27" cy="23" r="6" fill="#ff605b"/><circle cx="48" cy="23" r="6" fill="#ffbd45"/><circle cx="69" cy="23" r="6" fill="#00c748"/>
<path d="M1 42 H1199" stroke="#d3d6de"/><rect x="1" y="1" width="1198" height="748" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width="2"/>
</svg>`
