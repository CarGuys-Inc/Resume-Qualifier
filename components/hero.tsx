export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">

      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        Let&apos;s sort some {" "}
        <span
          className="font-bold hover:underline uppercase"
        >
          Resumes!!
        </span>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
