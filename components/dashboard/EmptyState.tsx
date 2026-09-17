export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 rounded-2xl bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 p-10 sm:p-16">
      <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6">
        <Icon />
      </div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {description}
      </p>
    </div>
  );
}
