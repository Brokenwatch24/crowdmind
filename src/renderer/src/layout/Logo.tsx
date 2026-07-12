export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-primary">
        <div className="h-[7px] w-[7px] rounded-sm bg-bg" />
      </div>
      {withWordmark && (
        <span className="font-mono-label text-[13.5px] font-semibold tracking-wide text-text">CROWDMIND</span>
      )}
    </div>
  )
}
