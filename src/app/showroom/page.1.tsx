"use client";

import { Suspense } from "react";
import ShowroomPage from "./showroom-page";

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShowroomPage />
    </Suspense>
  );
}
