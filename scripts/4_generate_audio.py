import asyncio
import json
import os
import sys

# Robust project root detection relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
TEMP_DIR = os.path.join(ROOT_DIR, "temp")
SCRIPT_FILE = os.path.join(TEMP_DIR, "script.json")
AUDIO_OUTPUT = os.path.join(TEMP_DIR, "voiceover.mp3")
DATA_SHORT_OUTPUT = os.path.join(TEMP_DIR, "data_short.json")
DATA_LONG_OUTPUT = os.path.join(TEMP_DIR, "data_long.json")

# High-quality neural voice selection
# en-US-ChristopherNeural: Authoritative, cerebral, calm documentary tone
# en-US-GuyNeural / en-US-AvaNeural
VOICE = "en-US-ChristopherNeural"


async def generate_speech_with_timestamps(full_text: str):
    import edge_tts

    communicate = edge_tts.Communicate(full_text, VOICE, rate="+3%", pitch="+0Hz")
    audio_data = bytearray()
    words = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            # offset and duration in 100-nanosecond ticks (1 sec = 10,000,000 ticks)
            start_sec = chunk["offset"] / 10_000_000.0
            duration_sec = chunk["duration"] / 10_000_000.0
            end_sec = start_sec + duration_sec
            word_str = chunk["text"]
            words.append({"word": word_str, "start": round(start_sec, 3), "end": round(end_sec, 3)})

    return audio_data, words


def fallback_mock_speech(full_text: str):
    print("[Step 4] Using fallback speech and timestamp generator...")
    tokens = full_text.split()
    words = []
    current_time = 0.2

    for token in tokens:
        duration = max(0.18, min(0.65, len(token) * 0.065))
        words.append({
            "word": token,
            "start": round(current_time, 3),
            "end": round(current_time + duration, 3)
        })
        current_time += duration + 0.08

    # Generate small silent MP3 placeholder if edge-tts unavailable
    # Valid minimal MP3 frame header
    minimal_mp3 = bytes([
        0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ] * 100)

    return minimal_mp3, words


def main():
    if not os.path.exists(SCRIPT_FILE):
        print(f"[Step 4] Error: Script file not found at {SCRIPT_FILE}. Run step 2 first.")
        sys.exit(1)

    with open(SCRIPT_FILE, "r", encoding="utf-8") as f:
        script_data = json.load(f)

    # Combine narrations from all beats
    beats = script_data.get("beats", [])
    full_narrative = " ".join([b.get("text", "").strip() for b in beats if b.get("text")])

    print(f"[Step 4] Synthesizing speech for {len(beats)} beats ({len(full_narrative.split())} words)...")

    words = []
    audio_bytes = None

    try:
        import edge_tts
        audio_bytes, words = asyncio.run(generate_speech_with_timestamps(full_narrative))
        print(f"[Step 4] edge-tts successfully generated {len(words)} word boundaries with voice {VOICE}.")
    except Exception as e:
        print(f"[Step 4] edge-tts failed or not installed ({e}). Falling back to algorithmic timing.")
        audio_bytes, words = fallback_mock_speech(full_narrative)

    # Save audio file
    with open(AUDIO_OUTPUT, "wb") as f:
        f.write(audio_bytes)
    print(f"[Step 4] Saved audio to {AUDIO_OUTPUT}")

    # Determine total duration
    total_duration = words[-1]["end"] + 1.0 if words else 30.0

    # Distribute beat start times and durations accurately across words
    total_words_count = len(words)
    if total_words_count > 0 and len(beats) > 0:
        words_per_beat = max(1, total_words_count // len(beats))
        for idx, beat in enumerate(beats):
            start_word_idx = min(idx * words_per_beat, total_words_count - 1)
            end_word_idx = min((idx + 1) * words_per_beat - 1, total_words_count - 1) if idx < len(beats) - 1 else total_words_count - 1
            
            beat["startTime"] = words[start_word_idx]["start"]
            beat_end = words[end_word_idx]["end"] + (0.5 if idx == len(beats) - 1 else 0.0)
            beat["duration"] = round(max(2.0, beat_end - beat["startTime"]), 2)

    script_data["words"] = words
    script_data["totalDuration"] = round(total_duration, 2)
    script_data["audioFile"] = os.path.basename(AUDIO_OUTPUT)

    # Save finalized short & long composition prop data files
    short_data = dict(script_data)
    short_data["targetFormat"] = "short"

    long_data = dict(script_data)
    long_data["targetFormat"] = "long"

    with open(DATA_SHORT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(short_data, f, indent=2)

    with open(DATA_LONG_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(long_data, f, indent=2)

    # Update script.json as well
    with open(SCRIPT_FILE, "w", encoding="utf-8") as f:
        json.dump(script_data, f, indent=2)

    print(f"[Step 4] Created Remotion render prop data files:")
    print(f"         - {DATA_SHORT_OUTPUT}")
    print(f"         - {DATA_LONG_OUTPUT}")
    print(f"[Step 4] Total audio length: {round(total_duration, 2)}s.")


if __name__ == "__main__":
    main()
