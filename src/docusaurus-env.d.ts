/// <reference types="@docusaurus/module-type-aliases" />

declare namespace JSX {
  type Element = import('react').JSX.Element;
  interface IntrinsicElements extends import('react').JSX.IntrinsicElements {}
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  export const ReactComponent: import('react').FC<import('react').SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
