"use client";

import { Button } from "@/components/ui/button";

export function BackButton() {
  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back(); // go to previous page
    } else {
      window.location.href = "/"; // fallback if no previous page
    }
  };

  return (
    <Button
      onClick={handleGoBack}
      className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
    >
      ⬅ Back
    </Button>
  );
}
