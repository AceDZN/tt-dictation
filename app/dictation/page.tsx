import { DictationForm } from "@/components/DictationForm";

export default function DictationPage() {
  return (
    <div className="min-h-screen bg-secondary py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary text-center">Create Dictation Game</h1>
        <DictationForm />
      </div>
    </div>
  )
}