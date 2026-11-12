// Browser-only: makes the small speech-only audio that gets transcribed instead of the video.

const SPEECH_BITRATE = 24_000; // mono Opus at 24 kbps ≈ 11 MB per hour, plenty for speech

/** The upload is never blocked on this: browsers without WebCodecs (or odd files) just skip it. */
export const canMakeSpeechAudio = () =>
  typeof window !== 'undefined' && typeof window.AudioEncoder !== 'undefined';

/**
 * Pulls the audio out of a video (a File, or a URL read with range requests) and re-encodes it as
 * mono Opus in webm. Returns null when the browser or the file can't do it.
 */
export async function makeSpeechAudio(
  video: Blob | string,
  onProgress?: (fraction: number) => void,
): Promise<Blob | null> {
  if (!canMakeSpeechAudio()) return null;
  try {
    // Loaded on demand: only the owner's upload and transcribe actions need it.
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Output,
      UrlSource,
      WebMOutputFormat,
    } = await import('mediabunny');
    const input = new Input({
      source: typeof video === 'string' ? new UrlSource(video) : new BlobSource(video),
      formats: ALL_FORMATS,
    });
    const target = new BufferTarget();
    const output = new Output({ format: new WebMOutputFormat(), target });
    const conversion = await Conversion.init({
      input,
      output,
      video: { discard: true },
      audio: { codec: 'opus', numberOfChannels: 1, bitrate: SPEECH_BITRATE, forceTranscode: true },
      showWarnings: false,
    });
    if (!conversion.isValid || conversion.utilizedTracks.length === 0) return null; // no sound
    if (onProgress) conversion.onProgress = (fraction) => onProgress(fraction);
    await conversion.execute();
    return target.buffer ? new Blob([target.buffer], { type: 'audio/webm' }) : null;
  } catch (error) {
    console.error('speech audio failed', error);
    return null;
  }
}
