import { DictationForm } from "@/components/DictationForm";


export default function DictationPage() {
  return (
    <div className="container mx-auto py-8 w-[480px] max-w-full">
      <h1 className="text-2xl font-bold mb-6">Create Dictation Game</h1>
      <DictationForm />
    </div>
  )
}