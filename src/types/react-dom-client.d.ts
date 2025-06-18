declare module "react-dom/client" {
  import * as React from "react";
  import * as ReactDOM from "react-dom";

  interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }

  interface RootOptions {
    hydrate?: boolean;
    /* eslint-disable @typescript-eslint/ban-types */
    [key: string]: unknown;
    /* eslint-enable */
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: RootOptions
  ): Root;

  export function hydrateRoot(
    container: Element | DocumentFragment,
    initialChildren: React.ReactNode,
    options?: RootOptions
  ): Root;

  export = ReactDOM;
}
