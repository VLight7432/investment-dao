import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  const Link = ({ children, to, end, className, ...props }) => {
    void end;
    return React.createElement("a", {
      href: to,
      className: typeof className === "function" ? className({ isActive: false, isPending: false }) : className,
      ...props,
    }, children);
  };

  return {
    ...actual,
    Link,
    NavLink: Link,
    useLocation: () => ({ pathname: "/" }),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
