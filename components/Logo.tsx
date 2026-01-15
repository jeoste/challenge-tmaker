import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icon.png"
        alt="Unearth Logo"
        width={32}
        height={32}
        className="w-8 h-8"
      />
      <span 
        className="text-xl font-bold text-foreground tracking-tight"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        UNEARTH
      </span>
    </div>
  );
};
