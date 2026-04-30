import { Input } from "@/components/ui/input";

type ResumeGridToolbarProps = {}
export default function ResumeGridToolbar(){
    return (
        <div className="flex flex-wrap gap-4 mb-4">
            <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                Filter
            </button>
        </div>
    )
}