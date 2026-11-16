import Image from "next/image";
import { cn } from "@/src/utils/cn";

/** Square banana mark from the company logo (sidebar, small spots). */
export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-icon.png"
      alt="St. Mary's logo"
      width={size}
      height={size}
      priority
      className={cn("shrink-0 rounded-xl shadow-soft", className)}
    />
  );
}

/** Full company logo lockup: banana emblem, "St. Mary's" wordmark, tagline. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Image
        src="/brand/logo-emblem.png"
        alt=""
        width={640}
        height={358}
        sizes="220px"
        priority
        className="h-auto w-[220px]"
      />
      <p className="-mt-2 font-brand text-[40px] font-black leading-none tracking-tight text-[#6b2f12]">
        St. Mary&apos;s
      </p>
      <div className="mt-2.5 flex items-center gap-3">
        <span className="h-[2px] w-8 rounded-full bg-banana-500" />
        <span className="text-[12.5px] font-semibold uppercase tracking-[0.28em] text-[#6b2f12]">
          Banana Distribution
        </span>
        <span className="h-[2px] w-8 rounded-full bg-banana-500" />
      </div>
    </div>
  );
}
