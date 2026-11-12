/** Collapsed transcript under the description. Only rendered for viewers who can watch. */
export function TranscriptPanel({ transcript }: { transcript: string }) {
  return (
    <details className="group glass-panel mt-6">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium select-none">
        <span className="text-muted-foreground group-open:hidden">Show transcript</span>
        <span className="hidden text-muted-foreground group-open:inline">Hide transcript</span>
      </summary>
      <p className="max-h-96 overflow-y-auto border-t border-glass-edge px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
        {transcript}
      </p>
    </details>
  );
}
