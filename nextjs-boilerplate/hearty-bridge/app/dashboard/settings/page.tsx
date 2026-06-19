"use client";

import { CogIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <CogIcon className="h-12 w-12 text-gray-300 mb-4" />
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Pengaturan</h2>
      <p className="text-sm text-gray-400">Fitur ini sedang dalam pengembangan.</p>
    </div>
  );
}
