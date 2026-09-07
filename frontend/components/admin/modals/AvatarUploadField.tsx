"use client";

export default function AvatarUploadField({
    photo,
    onPhotoChange,
    name,
    placeholder,
}: {
    photo: string | null | undefined;
    onPhotoChange: (dataUrl: string) => void;
    name: string;
    placeholder: string;
}) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onPhotoChange(reader.result as string);
        reader.readAsDataURL(file);
    }

    return (
        <div className="mb-5 flex items-center gap-4">
            <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden rounded-full bg-blue-soft">
                {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink/60">
                        {name.charAt(0).toUpperCase() || "+"}
                    </span>
                )}
                <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
            </label>
            <div>
                <div className="text-[13.5px] font-medium text-ink">{name || placeholder}</div>
                <label className="mt-1 block cursor-pointer text-[12px] text-pink-dark underline decoration-1 underline-offset-2 hover:text-pink-dark/80">
                    Change photo
                    <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
                </label>
            </div>
        </div>
    );
}
