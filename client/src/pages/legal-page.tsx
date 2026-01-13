import { X } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

interface LegalPageProps {
  title: string;
  type: "terms" | "privacy" | "legal" | "guidelines";
}

export default function LegalPage({ title, type }: LegalPageProps) {
  return (
    <div className="min-h-full bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/">
          <button className="text-gray-600 hover:text-gray-800" data-testid={`button-close-${type}`}>
            <X className="h-6 w-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <img 
          src={logoImage} 
          alt="Only-U" 
          className="h-20 object-contain mb-6"
        />
        <p className="text-gray-500 text-center">
          このページは準備中です
        </p>
      </div>
    </div>
  );
}
