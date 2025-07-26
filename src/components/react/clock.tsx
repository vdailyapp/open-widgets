// src/components/react/clock.tsx
import React from "react";

export default function Clock() {
  return <h2>{new Date().toLocaleTimeString()}</h2>;
}
